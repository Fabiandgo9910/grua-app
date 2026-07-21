-- Ejecutar esto en el SQL Editor de Supabase

create extension if not exists pgcrypto;

-- Tabla principal de grúas
create table if not exists gruas (
  id uuid primary key default gen_random_uuid(),
  matricula text not null unique,
  marca text not null,
  tipo text not null check (tipo in ('coche_taller','plataforma_ligera','plataforma_pesada','furgon_moto')),
  codigo text not null,
  created_at timestamptz default now()
);

-- Historial de mantenimientos y roturas (un mismo registro con "tipo")
create table if not exists historial_taller (
  id uuid primary key default gen_random_uuid(),
  grua_id uuid not null references gruas(id) on delete cascade,
  tipo text not null check (tipo in ('mantenimiento','rotura')),
  observacion text,
  fecha date not null,
  created_at timestamptz default now()
);

-- Historial de ITV (cada fila = una vez que pasó la ITV)
create table if not exists itv_historial (
  id uuid primary key default gen_random_uuid(),
  grua_id uuid not null references gruas(id) on delete cascade,
  fecha date not null,            -- fecha en la que se pasó la ITV
  proxima_fecha date not null,    -- fecha en la que toca la próxima
  created_at timestamptz default now()
);

-- Índices útiles
create index if not exists idx_historial_grua on historial_taller(grua_id);
create index if not exists idx_itv_grua on itv_historial(grua_id);

-- Activar Realtime (para que la app reciba cambios en vivo, sin recargar)
alter publication supabase_realtime add table gruas;
alter publication supabase_realtime add table historial_taller;
alter publication supabase_realtime add table itv_historial;

-- Políticas RLS básicas (abierto para empezar; ajusta según necesites autenticación)
alter table gruas enable row level security;
alter table historial_taller enable row level security;
alter table itv_historial enable row level security;

create policy "Acceso total gruas" on gruas for all using (true) with check (true);
create policy "Acceso total historial" on historial_taller for all using (true) with check (true);
create policy "Acceso total itv" on itv_historial for all using (true) with check (true);
