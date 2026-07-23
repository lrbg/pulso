-- Esquema de Pulso para Supabase.
-- Corre este script en: tu proyecto -> SQL Editor -> New query -> Run.

-- ---------- Tablas ----------
create table if not exists public.sesiones (
  id       uuid primary key default gen_random_uuid(),
  pregunta text not null,
  activa   boolean not null default false,
  creada   timestamptz not null default now()
);

create table if not exists public.respuestas (
  id        uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones(id) on delete cascade,
  texto     text not null,
  nombre    text,
  emocion   text,
  creada    timestamptz not null default now()
);

-- Carga y orden rapido del panel aunque lleguen cientos de respuestas.
create index if not exists respuestas_sesion_creada_idx
  on public.respuestas (sesion_id, creada desc);

-- ---------- Realtime ----------
-- Permite que el panel del organizador reciba cada respuesta al instante.
alter publication supabase_realtime add table public.respuestas;

-- ---------- Row Level Security ----------
-- App estatica con solo la anon key: cualquiera con la pagina puede operar.
-- El panel del organizador se protege con una clave del lado del cliente
-- (proteccion ligera). Suficiente para dinamicas de evento/taller.
alter table public.sesiones   enable row level security;
alter table public.respuestas enable row level security;

-- sesiones: lectura y administracion abiertas al rol anon.
create policy "sesiones_select" on public.sesiones for select using (true);
create policy "sesiones_insert" on public.sesiones for insert with check (true);
create policy "sesiones_update" on public.sesiones for update using (true) with check (true);

-- respuestas: cualquiera puede enviar y leer.
create policy "respuestas_select" on public.respuestas for select using (true);
create policy "respuestas_insert" on public.respuestas for insert with check (true);
