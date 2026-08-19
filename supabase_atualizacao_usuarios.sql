-- ATUALIZAÇÃO: adiciona a tabela de usuários (para o "Registrado por" automático).
-- Rode este script UMA vez no Supabase (SQL Editor > New query > Run) se você já
-- tinha criado o banco antes desta funcionalidade existir. É seguro rodar mesmo
-- que parte já exista (usa "if not exists" e ignora políticas duplicadas).

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  criado_em timestamptz not null default now()
);

alter table public.usuarios enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='usuarios' and policyname='usuarios_select_autenticados') then
    create policy "usuarios_select_autenticados" on public.usuarios for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='usuarios' and policyname='usuarios_insert_autenticados') then
    create policy "usuarios_insert_autenticados" on public.usuarios for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='usuarios' and policyname='usuarios_update_autenticados') then
    create policy "usuarios_update_autenticados" on public.usuarios for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='usuarios' and policyname='usuarios_delete_autenticados') then
    create policy "usuarios_delete_autenticados" on public.usuarios for delete to authenticated using (true);
  end if;
end $$;

-- Habilita tempo real na nova tabela (ignora erro se já estiver habilitada)
do $$
begin
  begin
    alter publication supabase_realtime add table public.usuarios;
  exception when duplicate_object then null;
  end;
end $$;
