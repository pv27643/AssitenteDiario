-- Módulo Gastos: despesas recorrentes e orçamento mensal por categoria.
-- Ver docs/ESTRUTURA_PROJETO.md secção 5 (Gastos).

alter table expenses
  add column recurring boolean not null default false;

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category text not null,
  monthly_limit numeric not null check (monthly_limit >= 0),
  created_at timestamptz default now(),
  unique (user_id, category)
);

create index budgets_user_id_idx on budgets (user_id);

alter table budgets enable row level security;

create policy "budgets_select_own" on budgets
  for select using (user_id = auth.uid());
create policy "budgets_insert_own" on budgets
  for insert with check (user_id = auth.uid());
create policy "budgets_update_own" on budgets
  for update using (user_id = auth.uid());
create policy "budgets_delete_own" on budgets
  for delete using (user_id = auth.uid());
