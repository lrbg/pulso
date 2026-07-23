// Capa de datos de Pulso.
// Dos modos transparentes para el resto de la app:
//  - Supabase: multiusuario real, respuestas en la nube y realtime.
//  - Demo (localStorage + BroadcastChannel): sin nube, sincroniza entre
//    pestanas del mismo navegador para poder probar el flujo completo.

const Store = (() => {
  let sb = null;
  if (!DEMO_MODE && window.supabase) {
    sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }

  // ---------- Modo demo (localStorage) ----------
  const LS_SESIONES = 'pulso_sesiones';
  const LS_RESP = 'pulso_respuestas';
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('pulso') : null;

  const read = (k) => JSON.parse(localStorage.getItem(k) || '[]');
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = () => 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);

  const demo = {
    async getActiveSession() {
      return read(LS_SESIONES).find(s => s.activa) || null;
    },
    async listSessions() {
      return read(LS_SESIONES).sort((a, b) => (a.creada < b.creada ? 1 : -1));
    },
    async createSession(pregunta) {
      const sesiones = read(LS_SESIONES).map(s => ({ ...s, activa: false }));
      const s = { id: uid(), pregunta, activa: true, creada: new Date().toISOString() };
      sesiones.push(s);
      write(LS_SESIONES, sesiones);
      if (bc) bc.postMessage({ type: 'session' });
      return s;
    },
    async setActiveSession(id) {
      const sesiones = read(LS_SESIONES).map(s => ({ ...s, activa: s.id === id }));
      write(LS_SESIONES, sesiones);
      if (bc) bc.postMessage({ type: 'session' });
    },
    async addResponse(r) {
      const all = read(LS_RESP);
      const row = { id: uid(), creada: new Date().toISOString(), ...r };
      all.push(row);
      write(LS_RESP, all);
      if (bc) bc.postMessage({ type: 'respuesta', row });
      return row;
    },
    async getResponses(sesionId) {
      return read(LS_RESP).filter(r => r.sesion_id === sesionId)
        .sort((a, b) => (a.creada < b.creada ? 1 : -1));
    },
    subscribeResponses(sesionId, onInsert) {
      const handler = (ev) => {
        const m = ev.data;
        if (m && m.type === 'respuesta' && m.row.sesion_id === sesionId) onInsert(m.row);
      };
      if (bc) bc.addEventListener('message', handler);
      return () => { if (bc) bc.removeEventListener('message', handler); };
    },
  };

  // ---------- Modo Supabase ----------
  const cloud = {
    async getActiveSession() {
      const { data } = await sb.from('sesiones').select('*').eq('activa', true).limit(1);
      return (data && data[0]) || null;
    },
    async listSessions() {
      const { data } = await sb.from('sesiones').select('*').order('creada', { ascending: false });
      return data || [];
    },
    async createSession(pregunta) {
      await sb.from('sesiones').update({ activa: false }).eq('activa', true);
      const { data } = await sb.from('sesiones').insert({ pregunta, activa: true }).select().single();
      return data;
    },
    async setActiveSession(id) {
      await sb.from('sesiones').update({ activa: false }).eq('activa', true);
      await sb.from('sesiones').update({ activa: true }).eq('id', id);
    },
    async addResponse(r) {
      const { data } = await sb.from('respuestas').insert(r).select().single();
      return data;
    },
    async getResponses(sesionId) {
      const { data } = await sb.from('respuestas').select('*')
        .eq('sesion_id', sesionId).order('creada', { ascending: false });
      return data || [];
    },
    subscribeResponses(sesionId, onInsert) {
      const ch = sb.channel('resp-' + sesionId)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'respuestas', filter: `sesion_id=eq.${sesionId}` },
          (payload) => onInsert(payload.new))
        .subscribe();
      return () => sb.removeChannel(ch);
    },
  };

  const api = DEMO_MODE ? demo : cloud;
  api.DEMO_MODE = DEMO_MODE;
  return api;
})();
