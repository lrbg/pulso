// Pantalla pública de proyección (v2): QR SIEMPRE visible + pregunta activa,
// sus opciones y el timer de la ronda. Sin contraseña. Solo lectura.

(function () {
  const $ = (id) => document.getElementById(id);
  let sesion = null;
  let renderedId = null;

  function participantURL() { return location.origin + location.pathname.replace(/proyectar\.html$/, 'index.html'); }
  function renderQR() {
    const url = participantURL();
    $('qr').innerHTML = '';
    if (window.QRCode) new QRCode($('qr'), { text: url, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
    $('url').textContent = url;
  }

  function renderOpciones() {
    const ops = (sesion && sesion.opciones) || [];
    $('ops').innerHTML = ops.map(o => `<div class="proj-op">${escapeHTML(o.t)}</div>`).join('');
  }

  function tick() {
    if (!sesion) return;
    const seg = Store.segundosRestantes(sesion);
    $('timer').textContent = seg;
    $('timer').classList.toggle('urgente', seg <= 5 && seg > 0);
  }
  setInterval(tick, 300);

  async function poll() {
    const s = await Store.getActiveSession();
    if (!s || !s.termina_en) {
      sesion = null; renderedId = null;
      $('preg').textContent = 'La pregunta aparecerá aquí en un momento…';
      $('preg').classList.add('espera');
      $('ops').innerHTML = '';
      $('timer').classList.add('hidden');
    } else {
      sesion = s;
      $('preg').textContent = s.pregunta;
      $('preg').classList.remove('espera');
      $('timer').classList.remove('hidden');
      if (renderedId !== s.id) { renderedId = s.id; renderOpciones(); }
      tick();
    }
    setTimeout(poll, 2000);
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  renderQR();
  poll();
})();
