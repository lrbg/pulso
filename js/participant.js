// Vista del participante: carga la pregunta activa, muestra la carita
// reaccionando mientras escriben, y registra la respuesta.

(function () {
  const $ = (id) => document.getElementById(id);
  const views = { espera: $('espera'), form: $('form'), gracias: $('gracias') };
  function show(name) {
    Object.keys(views).forEach(k => views[k].classList.toggle('hidden', k !== name));
  }

  let sesion = null;

  async function init() {
    sesion = await Store.getActiveSession();
    if (!sesion) {
      $('espera-face').innerHTML = faceHTML('confundido', 150);
      show('espera');
      // Reintentar por si el organizador abre la pregunta en breve.
      setTimeout(init, 4000);
      return;
    }
    $('pregunta-txt').textContent = sesion.pregunta;
    renderLive('');
    show('form');
  }

  function renderLive(text) {
    const mood = classifyMood(text);
    $('live-face').innerHTML = faceHTML(mood, 150);
    $('mood-tag').textContent = text.trim()
      ? moodLabel(mood)
      : 'Escribe tu respuesta y verás la reacción';
  }

  $('resp').addEventListener('input', (e) => renderLive(e.target.value));

  $('enviar').addEventListener('click', async () => {
    const texto = $('resp').value.trim();
    if (!texto) { $('resp').focus(); return; }

    // Anti-spam simple: evita reenviar lo mismo en menos de 3 segundos.
    const now = Date.now();
    const last = Number(sessionStorage.getItem('pulso_last') || 0);
    if (now - last < 3000) return;
    sessionStorage.setItem('pulso_last', String(now));

    const mood = classifyMood(texto);
    $('enviar').disabled = true;
    try {
      await Store.addResponse({
        sesion_id: sesion.id,
        texto,
        nombre: $('nombre').value.trim() || null,
        emocion: mood,
      });
      $('gracias-face').innerHTML = faceHTML(mood, 150);
      $('resp').value = '';
      show('gracias');
    } catch (err) {
      alert('No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.');
      console.error(err);
    } finally {
      $('enviar').disabled = false;
    }
  });

  $('otra').addEventListener('click', () => {
    renderLive('');
    show('form');
    $('resp').focus();
  });

  init();
})();
