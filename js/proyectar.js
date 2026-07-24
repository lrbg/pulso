// Pantalla publica de proyeccion: muestra SIEMPRE el QR grande (para que la gente
// escanee y entre a la sala) y la pregunta activa. Sin contrasena. Solo lectura.

(function () {
  const $ = (id) => document.getElementById(id);
  let sesionId = null;
  let unsub = null;

  function participantURL() {
    return location.origin + location.pathname.replace(/proyectar\.html$/, 'index.html');
  }

  // El QR apunta siempre a la misma URL de la sala: se dibuja una vez y se queda.
  function renderQR() {
    const url = participantURL();
    $('qr').innerHTML = '';
    if (window.QRCode) new QRCode($('qr'), { text: url, width: 260, height: 260, correctLevel: QRCode.CorrectLevel.M });
    $('url').textContent = url;
  }

  function setCount(n) {
    $('count').innerHTML = n > 0 ? `<b>${n}</b> respuesta${n === 1 ? '' : 's'} hasta ahora` : 'Sé el primero en responder';
  }

  async function loadCount() {
    if (!sesionId) return;
    const resp = await Store.getResponses(sesionId);
    let n = resp.length;
    setCount(n);
    if (unsub) { unsub(); unsub = null; }
    unsub = Store.subscribeResponses(sesionId, () => { n += 1; setCount(n); });
  }

  async function tick() {
    const s = await Store.getActiveSession();
    if (!s) {
      $('preg').textContent = 'La pregunta aparecerá aquí en un momento…';
      $('preg').classList.add('espera');
      $('count').textContent = '';
      if (sesionId !== null) { sesionId = null; if (unsub) { unsub(); unsub = null; } }
    } else {
      $('preg').textContent = s.pregunta;
      $('preg').classList.remove('espera');
      if (s.id !== sesionId) { sesionId = s.id; await loadCount(); }
    }
    setTimeout(tick, 4000);
  }

  renderQR();
  tick();
})();
