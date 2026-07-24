// Pruebas funcionales del motor de emociones del personaje de Pulso.
// Nivel: Componente/Unitaria · Tipo: Funcional
// Técnicas: Partición de equivalencia (una clase por emoción), valores límite
// (vacío/espacios), y "tabla de decisión" para la precedencia entre reglas.
// Correr con:  node --test

const test = require('node:test');
const assert = require('node:assert');
const { classifyMood, faceHTML, moodLabel, MOODS } = require('../js/character.js');

// ---------- EP: clase MIEDO ----------
test('TC-EMO-01 detecta miedo por palabras clave', () => {
  const casos = [
    'Tengo miedo de que la IA me reemplace',
    'Me preocupa que quite empleos',
    'Siento que es una amenaza para mi puesto',
    'Desconfío de lo que hace',
  ];
  for (const t of casos) assert.strictEqual(classifyMood(t), 'miedo', t);
});

// ---------- EP: clase FELIZ / POSITIVO ----------
test('TC-EMO-02 detecta positivo por palabras clave', () => {
  const casos = [
    'La uso para redactar correos',
    'Me ayuda a resumir reuniones',
    'Automatizo reportes y ahorro tiempo',
    'Me sirve para aprender más rápido',
  ];
  for (const t of casos) assert.strictEqual(classifyMood(t), 'feliz', t);
});

// ---------- EP: clase CONFUNDIDO ----------
test('TC-EMO-03 detecta confusión por palabras clave o signo de pregunta', () => {
  const casos = [
    'No sé bien cómo aplicarla',
    'Estoy un poco perdido con esto',
    'Tengo dudas',
    '¿Por dónde empiezo?',
  ];
  for (const t of casos) assert.strictEqual(classifyMood(t), 'confundido', t);
});

// ---------- BVA: entradas límite ----------
test('TC-EMO-04 texto vacío o solo espacios da neutral', () => {
  assert.strictEqual(classifyMood(''), 'neutral');
  assert.strictEqual(classifyMood('     '), 'neutral');
  assert.strictEqual(classifyMood(null), 'neutral');
  assert.strictEqual(classifyMood(undefined), 'neutral');
});

// ---------- Default: sin coincidencia ----------
test('TC-EMO-05 texto sin palabras clave cae en confundido (default seguro)', () => {
  assert.strictEqual(classifyMood('El cielo es azul hoy'), 'confundido');
});

// ---------- Tabla de decisión: precedencia entre reglas ----------
test('TC-EMO-06 miedo tiene prioridad sobre positivo cuando ambos aparecen', () => {
  // "me ayuda" (feliz) + "miedo" (miedo) -> debe ganar miedo (se evalúa primero)
  assert.strictEqual(classifyMood('Me ayuda pero tengo miedo de depender de ella'), 'miedo');
});

test('TC-EMO-07 positivo tiene prioridad sobre confusión cuando ambos aparecen', () => {
  // "no sé" (confundido) + "uso/automatizo" (feliz) -> gana feliz
  assert.strictEqual(classifyMood('No sé mucho pero la uso para automatizar'), 'feliz');
});

// ---------- Robustez: mayúsculas y acentos ----------
test('TC-EMO-08 es insensible a mayúsculas y tolera acentos', () => {
  assert.strictEqual(classifyMood('TENGO MIEDO'), 'miedo');
  assert.strictEqual(classifyMood('no se como usarla'), 'confundido'); // sin acento en "sé"
  assert.strictEqual(classifyMood('Me AYUDA bastante'), 'feliz');
});

// ---------- Salidas: etiquetas ----------
test('TC-EMO-09 moodLabel devuelve la etiqueta correcta por emoción', () => {
  assert.strictEqual(moodLabel('miedo'), 'Tiene miedo');
  assert.strictEqual(moodLabel('feliz'), 'Le entusiasma');
  assert.strictEqual(moodLabel('confundido'), 'Confundido');
  assert.strictEqual(moodLabel('neutral'), 'A la espera');
  assert.strictEqual(moodLabel('valor-invalido'), 'A la espera'); // fallback
});

// ---------- Salidas: render del rostro ----------
test('TC-EMO-10 faceHTML genera un rostro válido con la animación de la emoción', () => {
  for (const mood of Object.keys(MOODS)) {
    const html = faceHTML(mood, 120);
    assert.match(html, /<div class="anim-/, `faceHTML(${mood}) sin animación`);
    assert.ok(html.includes('#F4C430'), `faceHTML(${mood}) sin color amarillo`);
  }
  // El miedo incluye gotita de sudor (color azul)
  assert.ok(faceHTML('miedo', 120).includes('#378ADD'), 'miedo sin gotita');
  // La confusión incluye signos de interrogación
  assert.match(faceHTML('confundido', 120), /[?¿]/, 'confundido sin signos');
});

// ---------- Robustez: emoción desconocida no rompe el render ----------
test('TC-EMO-11 faceHTML con emoción inválida usa neutral sin lanzar error', () => {
  assert.doesNotThrow(() => faceHTML('inexistente', 100));
});
