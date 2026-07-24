// Capa de datos de Pulso (v2: opción múltiple + rondas con timer).
// Dos modos transparentes: Supabase (nube, realtime) y demo (localStorage).

const Store = (() => {
  let sb = null;
  if (!DEMO_MODE && window.supabase) {
    sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }

  const LS_SES = 'pulso_sesiones';
  const LS_RESP = 'pulso_respuestas';
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('pulso') : null;
  const read = (k) => JSON.parse(localStorage.getItem(k) || '[]');
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = () => 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const finEn = (seg) => new Date(Date.now() + (seg || 20) * 1000).toISOString();

  // ---------- Modo demo ----------
  const demo = {
    async listSessions() { return read(LS_SES).sort((a, b) => (a.creada < b.creada ? 1 : -1)); },
    async getActiveSession() { return read(LS_SES).find(s => s.activa) || null; },
    async createSession(pregunta, opciones) {
      const ses = read(LS_SES);
      const s = { id: uid(), pregunta, opciones: opciones || null, activa: false, termina_en: null, creada: new Date().toISOString() };
      ses.push(s); write(LS_SES, ses); if (bc) bc.postMessage({ type: 'session' }); return s;
    },
    async iniciarRonda(id, seg) {
      const fin = finEn(seg);
      const ses = read(LS_SES).map(s => ({ ...s, activa: s.id === id, termina_en: s.id === id ? fin : s.termina_en }));
      write(LS_SES, ses); if (bc) bc.postMessage({ type: 'session' }); return ses.find(s => s.id === id);
    },
    async cerrarRonda() {
      const ses = read(LS_SES).map(s => ({ ...s, activa: false }));
      write(LS_SES, ses); if (bc) bc.postMessage({ type: 'session' });
    },
    async addResponse(r) {
      const all = read(LS_RESP); const row = { id: uid(), creada: new Date().toISOString(), ...r };
      all.push(row); write(LS_RESP, all); if (bc) bc.postMessage({ type: 'respuesta', row }); return row;
    },
    async getResponses(sid) { return read(LS_RESP).filter(r => r.sesion_id === sid).sort((a, b) => (a.creada < b.creada ? 1 : -1)); },
    subscribeResponses(sid, onInsert) {
      const h = (ev) => { const m = ev.data; if (m && m.type === 'respuesta' && m.row.sesion_id === sid) onInsert(m.row); };
      if (bc) bc.addEventListener('message', h); return () => { if (bc) bc.removeEventListener('message', h); };
    },
  };

  // ---------- Modo Supabase ----------
  const cloud = {
    async listSessions() { const { data } = await sb.from('sesiones').select('*').order('creada', { ascending: false }); return data || []; },
    async getActiveSession() { const { data } = await sb.from('sesiones').select('*').eq('activa', true).limit(1); return (data && data[0]) || null; },
    async createSession(pregunta, opciones) {
      const { data } = await sb.from('sesiones').insert({ pregunta, opciones: opciones || null, activa: false }).select().single(); return data;
    },
    async iniciarRonda(id, seg) {
      await sb.from('sesiones').update({ activa: false }).eq('activa', true);
      await sb.from('sesiones').update({ activa: true, termina_en: finEn(seg) }).eq('id', id);
      const { data } = await sb.from('sesiones').select('*').eq('id', id).single(); return data;
    },
    async cerrarRonda() { await sb.from('sesiones').update({ activa: false }).eq('activa', true); },
    async addResponse(r) { const { data } = await sb.from('respuestas').insert(r).select().single(); return data; },
    async getResponses(sid) { const { data } = await sb.from('respuestas').select('*').eq('sesion_id', sid).order('creada', { ascending: false }); return data || []; },
    subscribeResponses(sid, onInsert) {
      const ch = sb.channel('resp-' + sid)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'respuestas', filter: `sesion_id=eq.${sid}` }, (p) => onInsert(p.new))
        .subscribe();
      return () => sb.removeChannel(ch);
    },
  };

  const api = DEMO_MODE ? demo : cloud;
  api.DEMO_MODE = DEMO_MODE;
  // Segundos restantes de la ronda (0 si terminó o no hay timer).
  api.segundosRestantes = (sesion) => {
    if (!sesion || !sesion.termina_en) return 0;
    return Math.max(0, Math.ceil((new Date(sesion.termina_en).getTime() - Date.now()) / 1000));
  };
  return api;
})();
