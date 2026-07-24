-- 12 preguntas de opción múltiple sobre necesidades de IA en el trabajo.
-- Cada opción trae su emoción para el personaje: feliz | miedo | confundido | neutral.
-- Ojo: inserta preguntas nuevas (no borra las existentes).

insert into public.sesiones (pregunta, opciones, activa) values
('¿Cómo te sientes con la llegada de la IA a tu trabajo?', '[{"t":"Me emociona, quiero aprovecharla","e":"feliz"},{"t":"Tengo curiosidad pero no sé por dónde empezar","e":"confundido"},{"t":"Me preocupa por mi puesto","e":"miedo"},{"t":"Me es indiferente","e":"neutral"}]', false),
('¿Qué tanto usas la IA hoy en tu trabajo?', '[{"t":"A diario, ya es parte de mi trabajo","e":"feliz"},{"t":"De vez en cuando","e":"neutral"},{"t":"Casi nada, no sé bien cómo","e":"confundido"},{"t":"Nada, me da desconfianza","e":"miedo"}]', false),
('¿Para qué te gustaría usar más la IA?', '[{"t":"Redactar y resumir","e":"feliz"},{"t":"Analizar datos y reportes","e":"feliz"},{"t":"Automatizar tareas repetitivas","e":"feliz"},{"t":"Aún no lo tengo claro","e":"confundido"}]', false),
('¿Qué es lo que más te frena para usarla?', '[{"t":"Falta de tiempo para aprender","e":"confundido"},{"t":"No sé qué herramientas usar","e":"confundido"},{"t":"Miedo a equivocarme o depender de ella","e":"miedo"},{"t":"Nada, la uso sin problema","e":"feliz"}]', false),
('¿Qué te preocupa más de la IA?', '[{"t":"Que reemplace empleos","e":"miedo"},{"t":"Que dé información incorrecta","e":"miedo"},{"t":"La privacidad de los datos","e":"miedo"},{"t":"No me preocupa, confío en ella","e":"feliz"}]', false),
('¿Qué tan preparado te sientes para usarla?', '[{"t":"Muy preparado","e":"feliz"},{"t":"Más o menos","e":"neutral"},{"t":"Poco, necesito capacitación","e":"confundido"},{"t":"Nada preparado","e":"miedo"}]', false),
('¿Qué necesitas para usar mejor la IA?', '[{"t":"Capacitación y ejemplos","e":"confundido"},{"t":"Herramientas y accesos","e":"neutral"},{"t":"Tiempo para practicar","e":"confundido"},{"t":"Ya tengo lo que necesito","e":"feliz"}]', false),
('¿Confías en los resultados que da la IA?', '[{"t":"Sí, casi siempre","e":"feliz"},{"t":"Depende, los reviso","e":"neutral"},{"t":"Poco, dudo de ellos","e":"confundido"},{"t":"No confío","e":"miedo"}]', false),
('Si la IA te ahorrara 1 hora al día, ¿qué harías?', '[{"t":"Tareas más estratégicas","e":"feliz"},{"t":"Aprender cosas nuevas","e":"feliz"},{"t":"Descansar un poco","e":"neutral"},{"t":"No sé, no lo había pensado","e":"confundido"}]', false),
('¿Crees que la IA mejorará tu trabajo?', '[{"t":"Sí, bastante","e":"feliz"},{"t":"Un poco","e":"neutral"},{"t":"No estoy seguro","e":"confundido"},{"t":"Me da miedo el cambio","e":"miedo"}]', false),
('¿Cómo prefieres adoptar la IA en el equipo?', '[{"t":"Capacitaciones prácticas","e":"feliz"},{"t":"Una herramienta lista para usar","e":"neutral"},{"t":"Acompañamiento paso a paso","e":"confundido"},{"t":"Prefiero no cambiar aún","e":"miedo"}]', false),
('En una palabra, la IA es…', '[{"t":"Una oportunidad","e":"feliz"},{"t":"Una herramienta más","e":"neutral"},{"t":"Un misterio","e":"confundido"},{"t":"Una amenaza","e":"miedo"}]', false);
