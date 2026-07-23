# Pulso

Encuesta abierta en vivo por código QR, con un personaje que reacciona a cada respuesta.
La gente escanea un QR, responde una pregunta de texto libre, y una carita amarilla
cambia de expresión según lo que escribe: tiembla con **miedo**, se ladea con `¿?` si hay
**confusión**, o sonríe cuando la respuesta es **positiva**. El organizador ve todo caer
en tiempo real y puede exportar los resultados a PDF.

Web estática (GitHub Pages) + Supabase (realtime). Sin backend propio. Multiusuario:
diseñada para 30+ participantes concurrentes y escala a cientos sin tocar código.

## Cómo se usa

- `index.html` — vista del participante (lo que abre el QR).
- `admin.html` — panel del organizador (crea preguntas, muestra el QR, ve respuestas en vivo, exporta PDF).

## Modo demo (sin configurar nada)

Tal cual, la app corre en **modo demo**: guarda todo en el navegador y sincroniza entre
pestañas del mismo navegador. Sirve para ver el flujo completo, pero no es multiusuario real.

## Activar multiusuario real (Supabase)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y corre `supabase/schema.sql`.
3. En **Project Settings → API**, copia la **Project URL** y la **anon public key**.
4. Pégalas en `js/config.js` (`SUPABASE_URL` y `SUPABASE_ANON_KEY`).
5. Cambia también `ADMIN_PASSCODE` por tu clave del organizador.

Al detectar una URL de Supabase válida, la app deja el modo demo y guarda las respuestas
en la nube, con el panel actualizándose en tiempo real.

## Detección de emoción

Por **palabras clave** (reglas en `js/character.js`, objeto `KEYWORDS`). Es gratis,
instantáneo y no depende de ninguna API. Para afinar, agrega palabras a cada emoción.

## Nota de seguridad

La app estática usa solo la `anon key`, así que el `ADMIN_PASSCODE` es protección ligera
(ofuscación), pensada para dinámicas de evento/taller, no para datos sensibles.
