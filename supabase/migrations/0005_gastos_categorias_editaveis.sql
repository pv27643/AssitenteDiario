-- Módulo Gastos: categorias deixam de ser fixas no código e passam a ser
-- geridas pelo próprio utilizador (criar/apagar), tal como as etiquetas
-- em Tarefas.

begin;

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

create index expense_categories_user_id_idx on expense_categories (user_id);

alter table expense_categories enable row level security;

create policy "expense_categories_select_own" on expense_categories
  for select using (user_id = auth.uid());
create policy "expense_categories_insert_own" on expense_categories
  for insert with check (user_id = auth.uid());
create policy "expense_categories_update_own" on expense_categories
  for update using (user_id = auth.uid());
create policy "expense_categories_delete_own" on expense_categories
  for delete using (user_id = auth.uid());

-- Semear as 5 categorias antigas para cada utilizador já existente, para não perderem nada.
insert into expense_categories (user_id, name)
select p.id, c.name
from profiles p
cross join (values ('Alimentação'), ('Gasolina'), ('Casa'), ('Lazer'), ('Outros')) as c(name)
on conflict (user_id, name) do nothing;

-- expenses: liga a category_id; se a categoria for apagada, a despesa fica
-- "sem categoria" em vez de ser apagada.
alter table expenses add column category_id uuid references expense_categories(id) on delete set null;

update expenses e
set category_id = ec.id
from expense_categories ec
where ec.user_id = e.user_id
  and ec.name = case e.category
    when 'alimentacao' then 'Alimentação'
    when 'gasolina' then 'Gasolina'
    when 'casa' then 'Casa'
    when 'lazer' then 'Lazer'
    when 'outros' then 'Outros'
    else initcap(e.category)
  end;

alter table expenses drop column category;
create index expenses_category_id_idx on expenses (category_id);

-- budgets: um orçamento não faz sentido sem categoria, por isso desaparece com ela.
alter table budgets add column category_id uuid references expense_categories(id) on delete cascade;

update budgets b
set category_id = ec.id
from expense_categories ec
where ec.user_id = b.user_id
  and ec.name = case b.category
    when 'alimentacao' then 'Alimentação'
    when 'gasolina' then 'Gasolina'
    when 'casa' then 'Casa'
    when 'lazer' then 'Lazer'
    when 'outros' then 'Outros'
    else initcap(b.category)
  end;

alter table budgets alter column category_id set not null;
alter table budgets drop column category;
alter table budgets add constraint budgets_user_id_category_id_key unique (user_id, category_id);

commit;
