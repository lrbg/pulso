// Vista del participante (v2): escanea una vez. En cada ronda ve la pregunta con
// opciones y un timer de 20s; vota tocando una opción. Al iniciar el organizador
// la siguiente pregunta, la pantalla cambia sola. Un voto por pregunta.

(function () {
  const $ = (id) => document.getElementById(id);
  const views = { espera: $('espera'), votar: $('votar'), votado: $('votado'), tiempo: $('tiempo') };
  function show(name) { Object.keys(views).forEach(k => views[k].classList.toggle('hidden', k !== name)); }

  let sesion = null;
  let renderedId = null;   // qué pregunta está pintada en las opciones
  let votedId = null;      // en qué pregunta ya votó (persiste aunque se reinicie el timer)

  function renderOpciones() {
    const ops = sesion.opciones || [];
    $('pregunta-txt').textContent = sesion.pregunta;
    $('opciones').innerHTML = ops.map((o, i) => `<button class="opcion" data-i="${i}">${escapeHTML(o.t)}</button>`).join('');
    Array.from($('opciones').querySelectorAll('.opcion')).forEach(btn => {
      btn.addEventListener('click', () => votar(Number(btn.dataset.i)));
    });
  }

  async function votar(i) {
    if (!sesion || votedId === sesion.id) return;
    if (Store.segundosRestantes(sesion) <= 0) return;
    const op = (sesion.opciones || [])[i];
    if (!op) return;
    Array.from($('opciones').querySelectorAll('.opcion')).forEach(b => (b.disabled = true));
    try {
      await Store.addResponse({ sesion_id: sesion.id, opcion: op.t, emocion: op.e, texto: op.t, nombre: null });
      votedId = sesion.id;
      $('votado-face').innerHTML = faceHTML(op.e, 150);
      $('votado-msg').textContent = 'Tu voto: ' + op.t;
      show('votado');
    } catch (err) {
      Array.from($('opciones').querySelectorAll('.opcion')).forEach(b => (b.disabled = false));
      alert('No se pudo registrar tu voto. Inténtalo de nuevo.');
      console.error(err);
    }
  }

  function decideView() {
    if (!sesion) { $('espera-face').innerHTML = faceHTML('neutral', 150); show('espera'); return; }
    if (votedId === sesion.id) { show('votado'); return; }
    if (Store.segundosRestantes(sesion) > 0) { show('votar'); }
    else { $('tiempo-face').innerHTML = faceHTML('neutral', 150); show('tiempo'); }
  }

  function tick() {
    if (!sesion || votedId === sesion.id) return;
    const seg = Store.segundosRestantes(sesion);
    $('timer').textContent = seg;
    $('timer').classList.toggle('urgente', seg <= 5);
    if (seg <= 0 && !views.tiempo) return;
    if (seg <= 0 && views.votar && !views.votar.classList.contains('hidden')) decideView();
  }
  setInterval(tick, 300);

  async function poll() {
    const activa = await Store.getActiveSession();
    if (!activa || !activa.termina_en) {
      sesion = null; renderedId = null;
      show('espera');
    } else {
      sesion = activa;
      if (renderedId !== sesion.id) { renderedId = sesion.id; renderOpciones(); }
      decideView();
    }
    setTimeout(poll, 2000);
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  poll();
})();
