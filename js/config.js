// Configuracion de Pulso.
// 1. Crea un proyecto gratis en https://supabase.com
// 2. Corre supabase/schema.sql en el SQL Editor de tu proyecto
// 3. Pega aqui la URL y la anon key (Project Settings -> API)
//
// Mientras estos valores sean los de ejemplo, la app corre en MODO DEMO
// (todo en el navegador, sin nube) para que la puedas ver funcionando.

const CONFIG = {
  SUPABASE_URL: 'https://rcxemmhjnnmjhenqefnn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_L5bBuufGvzGRnq6rd_tuAw_5n7pfqiR',

  // Clave simple para entrar al panel del organizador (admin.html).
  // Es proteccion ligera (ofuscacion), no seguridad fuerte. Cambiala.
  ADMIN_PASSCODE: 'pulso2026',
};

// Si no configuraste Supabase, arrancamos en modo demo (localStorage).
const DEMO_MODE = !CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'TU_SUPABASE_URL';
