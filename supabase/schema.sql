-- Ejecuta esto en un proyecto de Supabase NUEVO (no reutilices el de otro proyecto).
create table if not exists public.demo_records (
  kind text not null,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (kind, id)
);

create index if not exists demo_records_kind_created_idx
  on public.demo_records (kind, created_at desc);

-- Solo el servidor (service role) accede. Sin políticas = nadie más puede leer ni escribir.
alter table public.demo_records enable row level security;
