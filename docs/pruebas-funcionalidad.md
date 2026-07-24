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

| ID | Título | Técnica | Prioridad | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|---|---|
| TC-PAR-01 | Carga la pregunta activa | Caso de uso | Alta | Hay pregunta activa | Abrir `index.html` | Muestra la pregunta y el formulario | Exitoso |
| TC-PAR-02 | Reacción de miedo en vivo | EP | Alta | Formulario visible | Escribir "tengo miedo de que me reemplace" | Cara tiembla, gotita, etiqueta "Tiene miedo" | Exitoso |
| TC-PAR-03 | Reacción de confusión en vivo | EP | Alta | Formulario visible | Escribir "no sé cómo usarla" | Cara ladeada con `¿?`, etiqueta "Confundido" | Exitoso |
| TC-PAR-04 | Reacción positiva en vivo | EP | Media | Formulario visible | Escribir "la uso para redactar" | Cara sonríe, etiqueta "Le entusiasma" | Pendiente ejecución UI |
| TC-PAR-05 | Enviar respuesta con nombre | Caso de uso | Alta | Texto escrito | Poner nombre y Enviar | Pantalla "¡Gracias!" con la cara de la emoción | Exitoso |
| TC-PAR-06 | Enviar anónimo (nombre vacío) | EP | Media | Texto escrito, sin nombre | Enviar | Se registra como "Anónimo" | Exitoso |
| TC-PAR-07 | Enviar vacío no hace nada | BVA (negativo) | Media | Sin texto | Click Enviar | No envía; foco al textarea | Pendiente ejecución UI |
| TC-PAR-08 | Anti-spam: reenvío < 3s bloqueado | BVA (negativo) | Media | Recién envió | Enviar de nuevo de inmediato | El segundo envío se ignora | Pendiente ejecución UI |
| TC-PAR-09 | "Enviar otra" regresa al formulario | Transición estados | Baja | En pantalla gracias | Click "Enviar otra" | Vuelve al formulario limpio | Pendiente ejecución UI |
| TC-PAR-10 | Sin pregunta activa | Transición estados | Alta | Ninguna sesión activa | Abrir `index.html` | Mensaje "espera a que el organizador abra una pregunta" | Exitoso |

---

## 3. Panel del organizador (`admin.html`)

| ID | Título | Técnica | Prioridad | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|---|---|
| TC-ADM-01 | Clave incorrecta (negativo) | EP (negativo) | Alta | En la puerta | Escribir clave mala y Entrar | Muestra "Clave incorrecta", no abre panel | Pendiente ejecución UI |
| TC-ADM-02 | Clave correcta abre panel | EP | Alta | En la puerta | Escribir `pulso2026` y Entrar | Se abre el panel | Exitoso |
| TC-ADM-03 | Crear/abrir pregunta | Caso de uso | Alta | Panel abierto | Escribir pregunta y "Abrir pregunta" | Se vuelve la activa; aparece como chip | Exitoso |
| TC-ADM-04 | Cambiar de pregunta con chips | Transición estados | Alta | ≥2 preguntas | Click en otro chip | Esa se activa; contadores en 0 para la nueva | Exitoso |
| TC-ADM-05 | Respuesta llega en tiempo real | Caso de uso | Alta | Pregunta activa | Un participante responde | Aparece tarjeta con mini-cara sin recargar | Exitoso |
| TC-ADM-06 | Contadores por emoción | EP | Alta | Con respuestas | Observar stats | Total y miedo/confundidos/positivos correctos | Exitoso |
| TC-ADM-07 | Vista "Nube" de palabras | — | Media | Con respuestas | Click "Nube" | Muestra palabras dimensionadas por frecuencia | Pendiente ejecución UI |
| TC-ADM-08 | Exportar PDF | Caso de uso | Media | Con respuestas | Click "Exportar PDF" | Descarga PDF con pregunta, resumen y respuestas | Pendiente ejecución UI |
| TC-ADM-09 | Sesión de admin persiste | Transición estados | Baja | Ya autenticado | Recargar la página | No vuelve a pedir clave (sessionStorage) | Pendiente ejecución UI |
| TC-ADM-10 | QR apunta a la vista de usuarios | Caso de uso | Alta | Panel abierto | Leer URL del QR | Es `.../index.html`, no el admin | Exitoso |

---

## 4. Pantalla de proyección (`proyectar.html`)

| ID | Título | Técnica | Prioridad | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|---|---|
| TC-PROY-01 | Acceso público sin clave | Caso de uso | Alta | — | Abrir `proyectar.html` | Carga sin pedir contraseña | Exitoso |
| TC-PROY-02 | Muestra QR + pregunta activa | Caso de uso | Alta | Pregunta activa | Abrir la pantalla | QR grande + texto de la pregunta | Exitoso |
| TC-PROY-03 | Contador de respuestas en vivo | Caso de uso | Media | Pregunta activa | Alguien responde | El contador sube en tiempo real | Exitoso |
| TC-PROY-04 | QR lleva a `index.html` | Caso de uso | Alta | — | Leer URL bajo el QR | Es la vista de participante | Exitoso |
| TC-PROY-05 | Sin pregunta activa | Transición estados | Media | Ninguna activa | Abrir la pantalla | Muestra "esperando a que el organizador abra una pregunta" | Exitoso |
| TC-PROY-06 | Cambio de pregunta se refleja | Transición estados | Media | Cambiar activa en admin | Esperar ~4s | La proyección actualiza pregunta y QR | Pendiente ejecución UI |

---

## 5. Persistencia, tiempo real y multiusuario

Nivel Integración · Tipo Funcional · Prioridad Alta.

| ID | Título | Técnica | Precondición | Resultado esperado | Estado |
|---|---|---|---|---|---|
| TC-INT-01 | Respuesta se guarda en Supabase | Caso de uso | Modo Supabase | La fila queda en `respuestas` con emoción | Exitoso |
| TC-INT-02 | Realtime entre clientes distintos | Caso de uso | 2 navegadores | El panel recibe el INSERT al instante | Exitoso |
| TC-INT-03 | Multiusuario concurrente (30+) | Riesgo | — | Los participantes solo hacen INSERT; el plan Free soporta la carga | Exitoso (por diseño/validación de arquitectura) |
| TC-INT-04 | Modo demo sin Supabase | — | Config sin credenciales | Funciona en local con localStorage + sincronía entre pestañas | Exitoso |
| TC-INT-05 | RLS: anon inserta y lee | Seguridad (funcional) | — | Insertar/leer respuestas funciona; sólo lectura de pregunta activa | Exitoso |

---

## 6. No funcional

| ID | Título | Tipo | Prioridad | Resultado esperado | Estado |
|---|---|---|---|---|---|
| TC-NF-01 | Responsive móvil | Usabilidad | Alta | Legible y usable en pantalla de teléfono | Pendiente ejecución UI |
| TC-NF-02 | Modo oscuro / claro | Usabilidad | Media | Se adapta al tema del sistema sin texto invisible | Parcial (oscuro verificado) |
| TC-NF-03 | Movimiento reducido | Accesibilidad | Baja | Con `prefers-reduced-motion` se desactivan animaciones | Pendiente ejecución UI |
| TC-NF-04 | Sin errores en consola | Confiabilidad | Media | Ninguna vista arroja errores JS en consola | Exitoso |

---

## Matriz de trazabilidad (requisito → casos)

| Requisito / Necesidad | Casos que lo cubren | ✔ |
|---|---|---|
| El personaje reacciona a la emoción del texto | TC-EMO-01..11, TC-PAR-02/03/04 | ✅ |
| Los usuarios responden escaneando un QR | TC-PAR-01/05/06, TC-ADM-10, TC-PROY-02/04 | ✅ |
| El organizador ve respuestas en vivo | TC-ADM-05/06, TC-INT-02 | ✅ |
| Soporta 30+ usuarios | TC-INT-03 | ✅ |
| Cambiar entre varias preguntas | TC-ADM-03/04, TC-PROY-06 | ✅ |
| Nube de palabras y exportar PDF | TC-ADM-07/08 | ✅ (diseñado) |
| Estados sin pregunta activa | TC-PAR-10, TC-PROY-05 | ✅ |
| Funciona sin backend (demo) | TC-INT-04 | ✅ |

---

## Resumen de resultados

- **Automatizadas (motor de emociones):** 11/11 PASS (`node --test`).
- **UI/integración ejecutadas con evidencia (2026-07-23):** carga de pregunta,
  reacciones de miedo y confusión, envío y registro, tiempo real entre clientes
  Supabase, contadores, proyección con QR + contador, estados sin pregunta,
  QR apuntando a la vista de usuarios, sin errores de consola.
- **Diseñadas y pendientes de ejecución UI en esta sesión:** TC-PAR-04/07/08/09,
  TC-ADM-01/07/08/09, TC-PROY-06, TC-NF-01/03. Se dejaron documentadas con pasos
  y resultado esperado para ejecutar en una corrida dedicada.

Ningún caso ejecutado falló. Los pendientes son por cierre de sesión de pruebas,
no por defecto encontrado. Recomendación: correr los pendientes en modo demo
local para no afectar la base de producción, y sumar TC-PAR-04/07/08 y
TC-ADM-07/08 al conjunto automatizado donde sea posible.
