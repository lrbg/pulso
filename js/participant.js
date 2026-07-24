// Vista del participante: el usuario escanea el QR UNA vez y se queda en la sala.
// La pregunta activa se refresca sola: cuando el organizador avanza de pregunta,
// la pantalla cambia a la nueva sin que tenga que volver a escanear.

(function () {
  const $ = (id) => document.getElementById(id);
  const views = { espera: $('espera'), form: $('form'), gracias: $('gracias') };
  function show(name) {
    Object.keys(views).forEach(k => views[k].classList.toggle('hidden', k !== name));
  }

  let sesion = null;

  function renderLive(text) {
    const mood = classifyMood(text);
    $('live-face').innerHTML = faceHTML(mood, 150);
    $('mood-tag').textContent = text.trim()
      ? moodLabel(mood)
      : 'Escribe tu respuesta y verás la reacción';
  }

  // Prepara el formulario para una pregunta (nueva o la primera de la sesión).
  function mostrarPregunta(nueva) {
    sesion = nueva;
    $('pregunta-txt').textContent = sesion.pregunta;
    $('resp').value = '';
    renderLive('');
    // Nueva ronda: permite responder de inmediato aunque acabe de enviar la anterior.
    sessionStorage.removeItem('pulso_last');
    show('form');
  }

  // Ciclo de sondeo: mantiene al participante en la pregunta activa de la sala.
  async function poll() {
    const activa = await Store.getActiveSession();
    if (!activa) {
      if (sesion !== null) sesion = null;
      $('espera-face').innerHTML = faceHTML('confundido', 150);
      show('espera');
    } else if (!sesion || activa.id !== sesion.id) {
      // Primera pregunta, o el organizador avanzó a otra: cambiamos la vista.
      mostrarPregunta(activa);
    }
    setTimeout(poll, 4000);
  }

  $('resp').addEventListener('input', (e) => renderLive(e.target.value));

  $('enviar').addEventListener('click', async () => {
    if (!sesion) return;
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

  poll();
})();
