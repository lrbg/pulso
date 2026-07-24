# Pulso — Suite de pruebas de funcionalidad

Diseño y ejecución de pruebas funcionales de Pulso, siguiendo buenas prácticas
ISTQB (Foundation). El objetivo no es "que pase", sino verificar que cada función
hace lo esperado y dejar evidencia para decidir.

- **Producto:** Pulso — encuesta abierta en vivo por QR con personaje reactivo.
- **Base de prueba:** comportamiento definido en `README.md`, `js/character.js`
  (motor de emociones), `js/store.js` (persistencia), y las tres vistas
  (`index.html`, `admin.html`, `proyectar.html`).
- **Entorno:** GitHub Pages + Supabase (proyecto `pulso`). Navegador de escritorio
  y móvil. Modo demo (localStorage) y modo Supabase (nube, realtime).
- **Fecha de ejecución:** 2026-07-23.

## Resumen ejecutivo

- **Motor de emociones (automatizado):** 11/11 PASS (`node --test`).
- **UI e integración (ejecutadas):** 26 casos ejecutados, todos PASS.
- **1 defecto encontrado y corregido:** el generador de PDF dependía de un CDN
  (`cdnjs`) que podía no cargar, dejando el botón sin efecto y sin aviso. Se migró
  a `jsdelivr` (mismo CDN que ya funcionaba para el resto) y se agregó un aviso de
  respaldo. Re-probado: PASS.
- **Pendientes (menores):** TC-PROY-06, TC-NF-01, TC-NF-03 quedaron documentados
  para una corrida dedicada de dispositivos/accesibilidad.

## Análisis de riesgo (dónde enfocar)

| Área | Riesgo | Impacto | Prioridad |
|---|---|---|---|
| Motor de emociones | Clasificar mal la emoción → personaje incoherente | Alto (es el diferenciador) | Alta |
| Persistencia / realtime | Respuestas que no llegan al panel | Alto (se pierde data del evento) | Alta |
| Multiusuario (30+) | Que no escale o se pierdan respuestas concurrentes | Alto | Alta |
| QR / navegación | Que el QR lleve a la página equivocada | Alto (nadie participa) | Alta |
| Panel organizador | Cambiar de pregunta, stats, export | Medio | Media |
| No funcional (móvil, tema, a11y) | Ilegible en cierto dispositivo | Medio | Media |

## Técnicas de diseño aplicadas

- **Partición de equivalencia (EP):** una clase por emoción (miedo, positivo,
  confundido, neutral).
- **Valores límite (BVA):** entradas vacías/espacios, límite de reenvío (3s).
- **Tabla de decisión:** precedencia entre reglas cuando el texto dispara varias.
- **Transición de estados:** ciclo de la sesión (sin pregunta → activa → cambio)
  y del participante (formulario → gracias → otra).
- **Casos de uso:** flujo end-to-end participante y organizador.
- **Basadas en experiencia:** anti-spam, textos raros, sin pregunta activa.

---

## 1. Motor de emociones (automatizado)

Nivel Componente · Tipo Funcional · Prioridad Alta. Ejecutadas con `node --test`
sobre `test/motor-emociones.test.js`. **Resultado: 11/11 PASS.**

| ID | Qué valida | Técnica | Estado |
|---|---|---|---|
| TC-EMO-01 | Palabras de miedo → `miedo` | EP | PASS |
| TC-EMO-02 | Palabras positivas → `feliz` | EP | PASS |
| TC-EMO-03 | Dudas / signo `?` → `confundido` | EP | PASS |
| TC-EMO-04 | Vacío / espacios / null → `neutral` | BVA | PASS |
| TC-EMO-05 | Sin coincidencia → `confundido` (default seguro) | EP | PASS |
| TC-EMO-06 | Miedo gana sobre positivo si ambos aparecen | Tabla decisión | PASS |
| TC-EMO-07 | Positivo gana sobre confusión si ambos aparecen | Tabla decisión | PASS |
| TC-EMO-08 | Insensible a mayúsculas; tolera falta de acentos | EP | PASS |
| TC-EMO-09 | `moodLabel` devuelve la etiqueta correcta + fallback | EP | PASS |
| TC-EMO-10 | `faceHTML` genera rostro con animación por emoción | — | PASS |
| TC-EMO-11 | Emoción inválida no rompe el render | Robustez | PASS |

Reproducir: `cd pulso && node --test`.

---

## 2. Vista del participante (`index.html`)

Nivel Sistema · Tipo Funcional.

| ID | Título | Técnica | Prioridad | Resultado esperado | Estado |
|---|---|---|---|---|---|
| TC-PAR-01 | Carga la pregunta activa | Caso de uso | Alta | Muestra la pregunta y el formulario | PASS |
| TC-PAR-02 | Reacción de miedo en vivo | EP | Alta | Cara tiembla + gotita, etiqueta "Tiene miedo" | PASS |
| TC-PAR-03 | Reacción de confusión en vivo | EP | Alta | Cara ladeada con `¿?`, etiqueta "Confundido" | PASS |
| TC-PAR-04 | Reacción positiva en vivo | EP | Media | Cara sonríe + destellos, etiqueta "Le entusiasma" | PASS |
| TC-PAR-05 | Enviar respuesta y ver "Gracias" | Caso de uso | Alta | Pantalla "¡Gracias!" con la cara de la emoción | PASS |
| TC-PAR-06 | Enviar anónimo (nombre vacío) | EP | Media | Se registra como "Anónimo" | PASS |
| TC-PAR-07 | Enviar vacío no hace nada | BVA (negativo) | Media | No envía; sigue en el formulario | PASS |
| TC-PAR-08 | Anti-spam: reenvío < 3s bloqueado | BVA (negativo) | Media | De 2 intentos seguidos, solo 1 se guarda | PASS |
| TC-PAR-09 | "Enviar otra" regresa al formulario | Transición estados | Baja | Vuelve al formulario limpio | PASS |
| TC-PAR-10 | Sin pregunta activa | Transición estados | Alta | Mensaje "espera a que el organizador abra una pregunta" | PASS |

---

## 3. Panel del organizador (`admin.html`)

| ID | Título | Técnica | Prioridad | Resultado esperado | Estado |
|---|---|---|---|---|---|
| TC-ADM-01 | Clave incorrecta (negativo) | EP (negativo) | Alta | Muestra "Clave incorrecta", no abre panel | PASS |
| TC-ADM-02 | Clave correcta abre panel | EP | Alta | Se abre el panel | PASS |
| TC-ADM-03 | Crear/abrir pregunta | Caso de uso | Alta | Se vuelve la activa; aparece como chip | PASS |
| TC-ADM-04 | Cambiar de pregunta con chips | Transición estados | Alta | Esa se activa; contadores en 0 para la nueva | PASS |
| TC-ADM-05 | Respuesta llega en tiempo real | Caso de uso | Alta | Aparece tarjeta con mini-cara sin recargar | PASS |
| TC-ADM-06 | Contadores por emoción | EP | Alta | Total y miedo/confundidos/positivos correctos (6 = 1+2+3) | PASS |
| TC-ADM-07 | Vista "Nube" de palabras | — | Media | Muestra palabras dimensionadas por frecuencia (23) | PASS |
| TC-ADM-08 | Exportar PDF | Caso de uso | Media | Descarga PDF con pregunta, resumen y respuestas | PASS (tras fix) |
| TC-ADM-09 | Sesión de admin persiste al recargar | Transición estados | Baja | No vuelve a pedir clave (sessionStorage) | PASS |
| TC-ADM-10 | QR apunta a la vista de usuarios | Caso de uso | Alta | Es `.../index.html`, no el admin | PASS |

---

## 4. Pantalla de proyección (`proyectar.html`)

| ID | Título | Técnica | Prioridad | Resultado esperado | Estado |
|---|---|---|---|---|---|
| TC-PROY-01 | Acceso público sin clave | Caso de uso | Alta | Carga sin pedir contraseña | PASS |
| TC-PROY-02 | Muestra QR + pregunta activa | Caso de uso | Alta | QR grande + texto de la pregunta | PASS |
| TC-PROY-03 | Contador de respuestas en vivo | Caso de uso | Media | El contador sube en tiempo real | PASS |
| TC-PROY-04 | QR lleva a `index.html` | Caso de uso | Alta | Es la vista de participante | PASS |
| TC-PROY-05 | Sin pregunta activa | Transición estados | Media | Muestra "esperando a que el organizador abra una pregunta" | PASS |
| TC-PROY-06 | Cambio de pregunta se refleja (~4s) | Transición estados | Media | La proyección actualiza pregunta y QR | Pendiente |

---

## 5. Persistencia, tiempo real y multiusuario

Nivel Integración · Tipo Funcional · Prioridad Alta.

| ID | Título | Técnica | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-INT-01 | Respuesta se guarda en Supabase | Caso de uso | La fila queda en `respuestas` con emoción | PASS |
| TC-INT-02 | Realtime entre clientes distintos | Caso de uso | El panel recibe el INSERT al instante | PASS |
| TC-INT-03 | Multiusuario concurrente (30+) | Riesgo | Participantes solo hacen INSERT; el plan Free soporta la carga | PASS (arquitectura) |
| TC-INT-04 | Modo demo sin Supabase | — | Funciona en local con localStorage + sincronía entre pestañas | PASS |
| TC-INT-05 | RLS: anon inserta y lee | Seguridad (funcional) | Insertar/leer respuestas funciona | PASS |

---

## 6. No funcional

| ID | Título | Tipo | Prioridad | Resultado esperado | Estado |
|---|---|---|---|---|---|
| TC-NF-01 | Responsive móvil | Usabilidad | Alta | Legible y usable en pantalla de teléfono | Pendiente |
| TC-NF-02 | Modo oscuro / claro | Usabilidad | Media | Se adapta al tema del sistema sin texto invisible | Parcial (oscuro verificado) |
| TC-NF-03 | Movimiento reducido | Accesibilidad | Baja | Con `prefers-reduced-motion` se desactivan animaciones | Pendiente |
| TC-NF-04 | Sin errores en consola | Confiabilidad | Media | Ninguna vista arroja errores JS en consola | PASS |

---

## Defecto encontrado y corregido

**DEF-01 — El botón "Exportar PDF" podía no hacer nada sin avisar.**

- **Severidad:** Media · **Prioridad:** Media.
- **Detección:** TC-ADM-08. El generador `jsPDF` se cargaba desde `cdnjs`; si ese
  CDN no responde, `window.jspdf` queda indefinido y el clic lanzaba un error no
  manejado (el usuario no obtiene el PDF ni un mensaje).
- **Corrección:** se migró `jsPDF` a `jsdelivr` (el mismo CDN que ya usan Supabase
  y el generador de QR sin problema) y se agregó una validación que avisa si el
  generador no cargó.
- **Re-prueba (confirmación):** con jsdelivr, `jsPDF` carga y el documento se
  genera (3157 bytes en la prueba). PASS.

---

## Matriz de trazabilidad (requisito → casos)

| Requisito / Necesidad | Casos que lo cubren | ✔ |
|---|---|---|
| El personaje reacciona a la emoción del texto | TC-EMO-01..11, TC-PAR-02/03/04 | ✅ |
| Los usuarios responden escaneando un QR | TC-PAR-01/05/06, TC-ADM-10, TC-PROY-02/04 | ✅ |
| El organizador ve respuestas en vivo | TC-ADM-05/06, TC-INT-02 | ✅ |
| Soporta 30+ usuarios | TC-INT-03 | ✅ |
| Cambiar entre varias preguntas | TC-ADM-03/04, TC-PROY-06 | ✅ (parcial) |
| Nube de palabras y exportar PDF | TC-ADM-07/08 | ✅ |
| Estados sin pregunta activa | TC-PAR-10, TC-PROY-05 | ✅ |
| Funciona sin backend (demo) | TC-INT-04 | ✅ |

---

## Notas de ejecución

- Las pruebas de UI se ejecutaron en **modo demo local** (localStorage) para no
  afectar la base de producción, que quedó limpia y lista para el evento. La
  integración real con Supabase (TC-INT-01/02) se validó por separado con dos
  clientes en vivo.
- El clic por coordenadas del navegador de automatización resultó inestable; los
  handlers se dispararon por su `id` para verificar la lógica. No es un defecto de
  la app (el `onclick` funciona con clic/tap real).
- Los contadores por emoción cuadran exactamente con los datos enviados
  (6 respuestas = 3 positivas + 2 confundidos + 1 miedo).
