-- Ejecutar en el SQL Editor de Supabase, además de los scripts anteriores

create table if not exists tacografo_historial (
  id uuid primary key default gen_random_uuid(),
  grua_id uuid not null references gruas(id) on delete cascade,
  fecha date not null,            -- fecha en la que se pasó el tacógrafo
  proxima_fecha date not null,    -- fecha en la que toca el próximo (por defecto, +2 años)
  created_at timestamptz default now()
);

create index if not exists idx_tacografo_grua on tacografo_historial(grua_id);

alter publication supabase_realtime add table tacografo_historial;

alter table tacografo_historial enable row level security;
create policy "Acceso total tacografo" on tacografo_historial for all using (true) with check (true);
