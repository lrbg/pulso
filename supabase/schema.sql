-- Esquema de Pulso (v2: opción múltiple + rondas con timer) para Supabase.
-- Corre este script en: tu proyecto -> SQL Editor -> New query -> Run.

-- ---------- Tablas ----------
create table if not exists public.sesiones (
  id         uuid primary key default gen_random_uuid(),
  pregunta   text not null,
  opciones   jsonb,            -- [{ "t": "texto opción", "e": "feliz|miedo|confundido|neutral" }, ...]
  activa     boolean not null default false,
  termina_en timestamptz,      -- fin del timer de la ronda actual
  creada     timestamptz not null default now()
);

create table if not exists public.respuestas (
  id        uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones(id) on delete cascade,
  opcion    text,             -- texto de la opción elegida
  texto     text,             -- copia de la opción (compatibilidad)
  nombre    text,
  emocion   text,
  creada    timestamptz not null default now()
);

-- Si vienes de la v1, agrega las columnas nuevas sin perder datos:
alter table public.sesiones   add column if not exists opciones jsonb;
alter table public.sesiones   add column if not exists termina_en timestamptz;
alter table public.respuestas add column if not exists opcion text;

create index if not exists respuestas_sesion_creada_idx
  on public.respuestas (sesion_id, creada desc);

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.respuestas;

-- ---------- Row Level Security ----------
alter table public.sesiones   enable row level security;
alter table public.respuestas enable row level security;

drop policy if exists "sesiones_select" on public.sesiones;
drop policy if exists "sesiones_insert" on public.sesiones;
drop policy if exists "sesiones_update" on public.sesiones;
create policy "sesiones_select" on public.sesiones for select using (true);
create policy "sesiones_insert" on public.sesiones for insert with check (true);
create policy "sesiones_update" on public.sesiones for update using (true) with check (true);

drop policy if exists "respuestas_select" on public.respuestas;
drop policy if exists "respuestas_insert" on public.respuestas;
create policy "respuestas_select" on public.respuestas for select using (true);
create policy "respuestas_insert" on public.respuestas for insert with check (true);

-- Las 12 preguntas de opción múltiple están en supabase/seed-preguntas.sql
