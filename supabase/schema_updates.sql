-- Ejecutar en el SQL Editor de Supabase, además de los scripts anteriores

alter table gruas add column if not exists modelo text;
alter table historial_taller add column if not exists taller text;
