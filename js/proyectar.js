// Pantalla publica de proyeccion: muestra el QR grande y la pregunta activa
// para que los usuarios escaneen. Sin contrasena. Solo lectura.

(function () {
  const $ = (id) => document.getElementById(id);
  let sesionId = null;
  let unsub = null;

  function participantURL() {
    return location.origin + location.pathname.replace(/proyectar\.html$/, 'index.html');
  }

  function renderQR() {
    const url = participantURL();
    $('qr').innerHTML = '';
    if (window.QRCode) new QRCode($('qr'), { text: url, width: 260, height: 260, correctLevel: QRCode.CorrectLevel.M });
    $('url').textContent = url;
  }

  async function loadCount() {
    if (!sesionId) return;
    const resp = await Store.getResponses(sesionId);
    setCount(resp.length);
    if (unsub) { unsub(); unsub = null; }
    let n = resp.length;
    unsub = Store.subscribeResponses(sesionId, () => { n += 1; setCount(n); });
  }
  function setCount(n) {
    $('count').innerHTML = n > 0 ? `<b>${n}</b> respuesta${n === 1 ? '' : 's'} hasta ahora` : 'Sé el primero en responder';
  }

  async function tick() {
    const sesion = await Store.getActiveSession();
    if (!sesion) {
      $('activa').classList.add('hidden');
      $('espera').classList.remove('hidden');
      $('espera-face').innerHTML = faceHTML('neutral', 140);
      sesionId = null;
      if (unsub) { unsub(); unsub = null; }
    } else {
      $('espera').classList.add('hidden');
      $('activa').classList.remove('hidden');
      $('preg').textContent = sesion.pregunta;
      renderQR();
      if (sesion.id !== sesionId) {
        sesionId = sesion.id;
        await loadCount();
      }
    }
    // Revisa si el organizador cambio de pregunta.
    setTimeout(tick, 4000);
  }

  tick();
})();
