// Panel del organizador (v2): inicia rondas de 20s por pregunta y ve en vivo la
// gráfica de barras con la carita de la opción que va ganando.

(function () {
  const $ = (id) => document.getElementById(id);
  let sesion = null;
  let respuestas = [];
  let unsub = null;
  let timerInt = null;

  if (Store.DEMO_MODE) {
    const b = document.createElement('span');
    b.className = 'badge-demo';
    b.textContent = 'Modo demo (sin Supabase)';
    $('modo').replaceWith(b);
  } else {
    $('modo').textContent = 'Conectado a Supabase';
  }

  // ---------- Acceso ----------
  $('entrar').addEventListener('click', tryEnter);
  $('pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryEnter(); });
  function tryEnter() {
    if ($('pass').value === CONFIG.ADMIN_PASSCODE) { sessionStorage.setItem('pulso_admin', '1'); openPanel(); }
    else { $('gate-err').textContent = 'Clave incorrecta.'; }
  }
  if (sessionStorage.getItem('pulso_admin') === '1') openPanel();

  async function openPanel() {
    $('gate').classList.add('hidden');
    $('panel').classList.remove('hidden');
    await refreshSessions();
    const activa = await Store.getActiveSession();
    if (activa && activa.termina_en) await loadRound(activa);
  }

  // ---------- Preguntas ----------
  async function refreshSessions() {
    const sesiones = await Store.listSessions();
    // Orden estable por creación ascendente para que la partida siga un orden fijo.
    sesiones.sort((a, b) => (a.creada > b.creada ? 1 : -1));
    $('lista-sesiones').innerHTML = sesiones.map(s => {
      const activa = sesion && s.id === sesion.id;
      return `<span class="chip${activa ? ' chip-activa' : ''}" data-id="${s.id}">${escapeHTML(s.pregunta)}</span>`;
    }).join('');
    Array.from($('lista-sesiones').querySelectorAll('.chip')).forEach(chip => {
      chip.addEventListener('click', async () => {
        const all = await Store.listSessions();
        const elegida = all.find(s => s.id === chip.dataset.id);
        const s = await Store.iniciarRonda(elegida.id, 20);
        await loadRound(s);
      });
    });
  }

  async function loadRound(s) {
    sesion = s;
    if (unsub) { unsub(); unsub = null; }
    $('activa-zona').classList.remove('hidden');
    $('activa-txt').textContent = s.pregunta;
    respuestas = await Store.getResponses(s.id);
    render();
    renderQR();
    startTimer();
    await refreshSessions();
    unsub = Store.subscribeResponses(s.id, (row) => {
      if (respuestas.find(r => r.id === row.id)) return;
      respuestas.unshift(row);
      render();
    });
  }

  function startTimer() {
    if (timerInt) clearInterval(timerInt);
    const paint = () => {
      const seg = Store.segundosRestantes(sesion);
      $('admin-timer').textContent = seg;
      $('admin-timer').classList.toggle('urgente', seg <= 5 && seg > 0);
      $('admin-timer').classList.toggle('fin', seg === 0);
    };
    paint();
    timerInt = setInterval(paint, 300);
  }

  // ---------- Resultados (gráfica) ----------
  function render() {
    const ops = sesion.opciones || [];
    const counts = {};
    ops.forEach(o => (counts[o.t] = 0));
    respuestas.forEach(r => { if (counts[r.opcion] != null) counts[r.opcion]++; });
    const total = respuestas.length;
    const max = Math.max(1, ...ops.map(o => counts[o.t]));
    const leadCount = Math.max(0, ...ops.map(o => counts[o.t]));
    const lead = leadCount > 0 ? ops.find(o => counts[o.t] === leadCount) : null;

    $('lead-face').innerHTML = faceHTML(lead ? lead.e : 'neutral', 84);
    $('lead-label').textContent = lead ? `Va ganando: “${lead.t}”` : 'Aún sin votos';
    $('total-votos').textContent = total;

    $('chart').innerHTML = ops.map(o => {
      const c = counts[o.t];
      const pct = total ? Math.round((c / total) * 100) : 0;
      const w = Math.round((c / max) * 100);
      const isLead = lead && o.t === lead.t;
      return `<div class="bar-row${isLead ? ' lead' : ''}">
        <div class="bar-head">
          <span class="mini">${faceHTML(o.e, 24)}</span>
          <span class="bar-label">${escapeHTML(o.t)}</span>
          <span class="bar-count">${c} · ${pct}%</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
      </div>`;
    }).join('');
  }

  // ---------- Controles ----------
  $('reiniciar').addEventListener('click', async () => {
    if (!sesion) return;
    const s = await Store.iniciarRonda(sesion.id, 20);
    sesion = s; startTimer();
  });
  $('cerrar').addEventListener('click', async () => {
    await Store.cerrarRonda();
    if (timerInt) clearInterval(timerInt);
    $('admin-timer').textContent = '—';
    await refreshSessions();
  });

  // ---------- QR ----------
  function participantURL() { return location.origin + location.pathname.replace(/admin\.html$/, 'index.html'); }
  function renderQR() {
    const url = participantURL();
    $('qr').innerHTML = '';
    if (window.QRCode) new QRCode($('qr'), { text: url, width: 168, height: 168, correctLevel: QRCode.CorrectLevel.M });
    $('qr-url').textContent = url;
  }

  // ---------- Exportar PDF ----------
  $('exportar').addEventListener('click', () => {
    if (!sesion) return;
    if (!window.jspdf || !window.jspdf.jsPDF) { alert('No se pudo cargar el generador de PDF. Revisa tu conexión.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const ops = sesion.opciones || [];
    const counts = {};
    ops.forEach(o => (counts[o.t] = 0));
    respuestas.forEach(r => { if (counts[r.opcion] != null) counts[r.opcion]++; });
    const total = respuestas.length;
    let y = 18;
    doc.setFontSize(16); doc.text('Pulso — Resultados', 14, y); y += 9;
    doc.setFontSize(11); doc.setTextColor(90);
    doc.text('Pregunta: ' + sesion.pregunta, 14, y, { maxWidth: 180 }); y += 9;
    doc.text('Total de votos: ' + total, 14, y); y += 8;
    doc.setDrawColor(220); doc.line(14, y, 196, y); y += 8;
    doc.setTextColor(20);
    ops.slice().sort((a, b) => counts[b.t] - counts[a.t]).forEach(o => {
      const c = counts[o.t]; const pct = total ? Math.round((c / total) * 100) : 0;
      const lines = doc.splitTextToSize(`${o.t} — ${c} votos (${pct}%)`, 180);
      if (y + lines.length * 6 > 285) { doc.addPage(); y = 18; }
      doc.text(lines, 14, y); y += lines.length * 6 + 2;
    });
    doc.save('pulso-resultados.pdf');
  });

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
