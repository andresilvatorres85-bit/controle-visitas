-- Execute este script inteiro no Supabase: painel do projeto > SQL Editor > New query > Run.

-- ========== TABELA DE REGISTROS (contatos/visitas) ==========
create table if not exists public.registros (
  id uuid primary key default gen_random_uuid(),
  dia int,
  mes int not null,
  ano int not null,
  funcao text not null,        -- 'Sen' | 'Dep' | 'Consultor' | 'AsPar EB'
  nome text not null,
  partido text,                 -- sigla do partido, ou órgão/consultoria para consultores
  uf text,                      -- UF do parlamentar, ou estado do assessor (AsPar EB)
  papel text,                   -- 'S' Senador | 'AS' Asse.Sen | 'D' Deputado | 'AD' Asse.Dep | 'C' Consultor | 'AE' AsPar EB
  espectro text,                -- 'E' Esquerda | 'D' Direita | 'C' Centro
  assunto text,                 -- usado só no AsPar EB: 'Cartilha' | 'Dúvida' | 'Ajuste de emenda'
  autor text not null,          -- quem lançou o registro
  protocolo text,
  criado_em timestamptz not null default now()
);

alter table public.registros enable row level security;

create policy "registros_select_autenticados"
  on public.registros for select to authenticated using (true);
create policy "registros_insert_autenticados"
  on public.registros for insert to authenticated with check (true);
create policy "registros_delete_autenticados"
  on public.registros for delete to authenticated using (true);

-- ========== TABELA DE PARTIDOS (editável pelo app) ==========
create table if not exists public.partidos (
  id uuid primary key default gen_random_uuid(),
  sigla text not null,
  nome text not null,
  espectro text not null,       -- 'E' | 'D' | 'C'
  criado_em timestamptz not null default now()
);

alter table public.partidos enable row level security;

create policy "partidos_select_autenticados"
  on public.partidos for select to authenticated using (true);
create policy "partidos_insert_autenticados"
  on public.partidos for insert to authenticated with check (true);
create policy "partidos_update_autenticados"
  on public.partidos for update to authenticated using (true) with check (true);
create policy "partidos_delete_autenticados"
  on public.partidos for delete to authenticated using (true);

-- ========== TEMPO REAL (todos veem os lançamentos na hora) ==========
alter publication supabase_realtime add table public.registros;
alter publication supabase_realtime add table public.partidos;

-- Observação: a lista inicial de partidos (vinda da planilha) é inserida
-- automaticamente pelo próprio app no primeiro acesso, caso a tabela esteja vazia.
