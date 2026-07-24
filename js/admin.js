// Panel del organizador: crea preguntas, muestra el QR, escucha respuestas
// en tiempo real, resume el animo y exporta a PDF.

(function () {
  const $ = (id) => document.getElementById(id);
  let sesion = null;
  let respuestas = [];
  let unsub = null;

  $('modo').textContent = Store.DEMO_MODE ? '' : 'Conectado a Supabase';
  if (Store.DEMO_MODE) {
    const b = document.createElement('span');
    b.className = 'badge-demo';
    b.textContent = 'Modo demo (sin Supabase)';
    $('modo').replaceWith(b);
  }

  // ---------- Puerta de acceso ----------
  $('entrar').addEventListener('click', tryEnter);
  $('pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryEnter(); });
  function tryEnter() {
    if ($('pass').value === CONFIG.ADMIN_PASSCODE) {
      sessionStorage.setItem('pulso_admin', '1');
      openPanel();
    } else {
      $('gate-err').textContent = 'Clave incorrecta.';
    }
  }
  if (sessionStorage.getItem('pulso_admin') === '1') openPanel();

  async function openPanel() {
    $('gate').classList.add('hidden');
    $('panel').classList.remove('hidden');
    await refreshSessions();
    const activa = await Store.getActiveSession();
    if (activa) await loadSession(activa);
  }

  // ---------- Sesiones ----------
  $('crear').addEventListener('click', async () => {
    const preg = $('nueva-preg').value.trim();
    if (!preg) return;
    const s = await Store.createSession(preg);
    $('nueva-preg').value = '';
    await refreshSessions();
    await loadSession(s);
  });

  async function refreshSessions() {
    const sesiones = await Store.listSessions();
    $('lista-sesiones').innerHTML = sesiones.map(s =>
      `<span class="chip" data-id="${s.id}" style="cursor:pointer${s.activa ? ';border-color:var(--amarillo-borde);background:#fff6db;color:#3a2c00' : ''}">${escapeHTML(s.pregunta)}</span>`
    ).join('');
    Array.from($('lista-sesiones').querySelectorAll('.chip')).forEach(chip => {
      chip.addEventListener('click', async () => {
        await Store.setActiveSession(chip.dataset.id);
        await refreshSessions();
        const all = await Store.listSessions();
        await loadSession(all.find(s => s.id === chip.dataset.id));
      });
    });
  }

  async function loadSession(s) {
    sesion = s;
    if (unsub) { unsub(); unsub = null; }
    $('activa-zona').classList.remove('hidden');
    $('activa-txt').textContent = s.pregunta;
    respuestas = await Store.getResponses(s.id);
    renderAll();
    renderQR();
    unsub = Store.subscribeResponses(s.id, (row) => {
      if (respuestas.find(r => r.id === row.id)) return;
      respuestas.unshift(row);
      renderAll();
    });
  }

  // ---------- QR ----------
  function participantURL() {
    return location.origin + location.pathname.replace(/admin\.html$/, 'index.html');
  }
  function renderQR() {
    const url = participantURL();
    $('qr').innerHTML = '';
    if (window.QRCode) new QRCode($('qr'), { text: url, width: 168, height: 168, correctLevel: QRCode.CorrectLevel.M });
    $('qr-url').textContent = url;
  }

  // ---------- Render ----------
  function renderAll() {
    const counts = { miedo: 0, confundido: 0, feliz: 0, neutral: 0 };
    respuestas.forEach(r => { counts[r.emocion] = (counts[r.emocion] || 0) + 1; });
    $('s-total').textContent = respuestas.length;
    $('s-miedo').textContent = counts.miedo || 0;
    $('s-confundido').textContent = counts.confundido || 0;
    $('s-feliz').textContent = counts.feliz || 0;

    $('vacio').classList.toggle('hidden', respuestas.length > 0);

    $('tarjetas').innerHTML = respuestas.map(r => `
      <div class="resp-card">
        <div class="mini">${faceHTML(r.emocion || 'neutral', 48)}</div>
        <div>
          <p class="txt">${escapeHTML(r.texto)}</p>
          <p class="meta">${r.nombre ? escapeHTML(r.nombre) : 'Anónimo'} · ${moodLabel(r.emocion || 'neutral')}</p>
        </div>
      </div>`).join('');

    renderCloud();
  }

  const STOP = new Set(('de la el en y a los las un una que se con por para es su al lo como mas más o me mi te tu ni sin ya muy nos ha he han sobre entre este esta eso esa ese del uso usar puedo').split(' '));
  function renderCloud() {
    const freq = {};
    respuestas.forEach(r => {
      (r.texto || '').toLowerCase().replace(/[^a-záéíóúñ\s]/g, ' ').split(/\s+/).forEach(w => {
        if (w.length < 4 || STOP.has(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });
    });
    const items = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 40);
    const max = items.length ? items[0][1] : 1;
    $('nube').innerHTML = items.length
      ? items.map(([w, n]) => {
          const size = 14 + Math.round((n / max) * 26);
          const strong = n / max > 0.6;
          return `<span style="font-size:${size}px;font-weight:${strong ? 600 : 400};color:${strong ? 'var(--acento)' : 'var(--texto-2)'}">${escapeHTML(w)}</span>`;
        }).join('')
      : '<p class="muted center">Sin palabras todavía.</p>';
  }

  $('ver-tarjetas').addEventListener('click', () => toggleView('tarjetas'));
  $('ver-nube').addEventListener('click', () => toggleView('nube'));
  function toggleView(which) {
    $('tarjetas').classList.toggle('hidden', which !== 'tarjetas');
    $('nube').classList.toggle('hidden', which !== 'nube');
    $('ver-tarjetas').classList.toggle('btn-primary', which === 'tarjetas');
    $('ver-nube').classList.toggle('btn-primary', which === 'nube');
  }

  // ---------- Exportar PDF ----------
  $('exportar').addEventListener('click', () => {
    if (!sesion) return;
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('No se pudo cargar el generador de PDF. Revisa tu conexión e inténtalo de nuevo.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const counts = { miedo: 0, confundido: 0, feliz: 0 };
    respuestas.forEach(r => { if (counts[r.emocion] != null) counts[r.emocion]++; });
    let y = 18;
    doc.setFontSize(16); doc.text('Pulso — Resultados', 14, y); y += 8;
    doc.setFontSize(11); doc.setTextColor(90);
    doc.text('Pregunta: ' + sesion.pregunta, 14, y, { maxWidth: 180 }); y += 10;
    doc.text(`Respuestas: ${respuestas.length}   ·   Miedo: ${counts.miedo}   Confundidos: ${counts.confundido}   Positivos: ${counts.feliz}`, 14, y); y += 10;
    doc.setDrawColor(220); doc.line(14, y, 196, y); y += 8;
    doc.setTextColor(20); doc.setFontSize(11);
    respuestas.slice().reverse().forEach((r, i) => {
      const nombre = r.nombre || 'Anónimo';
      const lines = doc.splitTextToSize(`${i + 1}. ${r.texto}  (${nombre} · ${moodLabel(r.emocion || 'neutral')})`, 180);
      if (y + lines.length * 6 > 285) { doc.addPage(); y = 18; }
      doc.text(lines, 14, y); y += lines.length * 6 + 2;
    });
    doc.save('pulso-resultados.pdf');
  });

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
