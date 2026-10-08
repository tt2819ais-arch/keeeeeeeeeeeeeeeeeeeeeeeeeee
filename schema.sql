-- schema.sql — выполнить один раз в Supabase Dashboard > SQL Editor.
-- Одно хранилище в стиле KV: вся персистентность API в одной таблице.
-- RLS включён, публичных политик НЕТ (читает только service_role через функцию).

create table if not exists kv_store (
  key   text primary key,
  value jsonb not null,
  exp   timestamptz null
);

create index if not exists kv_store_exp_idx on kv_store (exp);

alter table kv_store enable row level security;
-- намеренно без политик: anon/authenticated ничего не видят,
-- Edge Function ходит с service_role (RLS его не касается).
