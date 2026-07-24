// Personaje reactivo de Pulso.
// Carita redonda amarilla con ojos negros tipo pixel que cambia de expresion
// segun la emocion detectada en la respuesta de texto libre.

const MOODS = {
  neutral:    { anim: 'anim-bob',    eyeL: 'sq14', eyeR: 'sq14',    mouth: 'line',  extra: '',      label: 'A la espera' },
  feliz:      { anim: 'anim-bob',    eyeL: 'happy', eyeR: 'happy',  mouth: 'smile', extra: 'spark', label: 'Le entusiasma' },
  confundido: { anim: 'anim-wobble', eyeL: 'sq14', eyeR: 'lineeye', mouth: 'wavy',  extra: 'quest', label: 'Confundido' },
  miedo:      { anim: 'anim-tremble', eyeL: 'wide', eyeR: 'wide',   mouth: 'o',     extra: 'sweat', label: 'Tiene miedo' },
};

// Diccionario de palabras clave por emocion. Facil de ampliar.
const KEYWORDS = {
  miedo: /miedo|temor|reemplaz|me quita|quitar|quitara|peligr|asust|espant|amenaz|desconf|preocup|inseg|riesgo|perder mi|perdere|sustituy/,
  confundido: /no s[eé]|c[oó]mo|no entiend|confund|perdid|duda|dudas|tal vez|quiz[aá]|no estoy segur|no me queda claro|complicad|dificil|dif[ií]cil|\?/,
  feliz: /redact|resum|autom|gener|ayud|util|mejor|r[aá]pid|product|encant|genial|facilit|aprend|eficien|optim|me sirve|la uso|lo uso|apoy|ahorr|traduc|analiz|ideas/,
};

// Devuelve la emocion (clave de MOODS) para un texto dado.
function classifyMood(text) {
  const t = (text || '').toLowerCase().trim();
  if (t === '') return 'neutral';
  if (KEYWORDS.miedo.test(t)) return 'miedo';
  if (KEYWORDS.feliz.test(t)) return 'feliz';
  if (KEYWORDS.confundido.test(t)) return 'confundido';
  // Sin coincidencia clara: cara de confusion (no sabemos como tomarlo).
  return 'confundido';
}

function eyeHTML(type, s) {
  if (type === 'sq14')   return `<i style="width:${14*s}px;height:${14*s}px;background:#141414;display:block;border-radius:2px"></i>`;
  if (type === 'wide')   return `<i style="width:${19*s}px;height:${19*s}px;background:#141414;display:block;border-radius:2px"></i>`;
  if (type === 'happy')  return `<i style="width:${18*s}px;height:${9*s}px;border:${3*s}px solid #141414;border-bottom:none;border-radius:${12*s}px ${12*s}px 0 0;display:block"></i>`;
  if (type === 'lineeye')return `<i style="width:${16*s}px;height:${4*s}px;background:#141414;display:block;border-radius:2px;margin-bottom:${6*s}px"></i>`;
  return '';
}

function mouthHTML(type, s) {
  if (type === 'line')  return `<span style="width:${26*s}px;height:${4*s}px;background:#141414;border-radius:4px;display:block"></span>`;
  if (type === 'smile') return `<span style="width:${34*s}px;height:${17*s}px;border:${4*s}px solid #141414;border-top:none;border-radius:0 0 ${34*s}px ${34*s}px;display:block"></span>`;
  if (type === 'o')     return `<span style="width:${18*s}px;height:${22*s}px;border:${3*s}px solid #141414;border-radius:50%;display:block"></span>`;
  if (type === 'wavy')  return `<span style="width:${28*s}px;height:${8*s}px;border-bottom:${3*s}px solid #141414;border-radius:0 0 60% 60%/0 0 100% 100%;display:block;transform:rotate(-4deg)"></span>`;
  return '';
}

function extraHTML(type, s) {
  if (type === 'sweat') return `<span style="position:absolute;top:${26*s}px;right:${20*s}px;width:${11*s}px;height:${15*s}px;background:#378ADD;border-radius:0 50% 50% 50%;transform:rotate(45deg)"></span>`;
  if (type === 'quest') return `<span class="floaty" style="position:absolute;top:${-6*s}px;right:${8*s}px;font-size:${26*s}px;font-weight:700;color:#7a7a7a">?</span><span class="floaty" style="position:absolute;top:${10*s}px;left:${2*s}px;font-size:${20*s}px;font-weight:700;color:#9a9a9a;animation-delay:.5s">¿</span>`;
  if (type === 'spark') return `<span style="position:absolute;top:${14*s}px;left:${12*s}px;width:${7*s}px;height:${7*s}px;border:2px solid #E0A800;transform:rotate(45deg)"></span><span style="position:absolute;top:${18*s}px;right:${14*s}px;width:${6*s}px;height:${6*s}px;border:2px solid #E0A800;transform:rotate(45deg)"></span>`;
  return '';
}

// Devuelve el HTML de la carita para una emocion y tamano en px.
function faceHTML(mood, size) {
  const c = MOODS[mood] || MOODS.neutral;
  const s = size / 160;
  return `<div class="${c.anim}" style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:#F4C430;border:${3*s}px solid #E0A800">`
    + `<div style="position:absolute;top:${50*s}px;left:0;width:100%;display:flex;justify-content:center;gap:${24*s}px;align-items:flex-end">${eyeHTML(c.eyeL, s)}${eyeHTML(c.eyeR, s)}</div>`
    + `<div style="position:absolute;top:${92*s}px;left:0;width:100%;display:flex;justify-content:center">${mouthHTML(c.mouth, s)}</div>`
    + extraHTML(c.extra, s)
    + `</div>`;
}

function moodLabel(mood) {
  return (MOODS[mood] || MOODS.neutral).label;
}

// Permite reutilizar el motor en pruebas con Node (en el navegador no hace nada).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MOODS, KEYWORDS, classifyMood, faceHTML, moodLabel };
}
