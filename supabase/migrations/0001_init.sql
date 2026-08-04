-- Assistente Diário — schema inicial
-- Ver docs/ESTRUTURA_PROJETO.md secção 3 para o modelo de dados.

create extension if not exists "pgcrypto";

-- =========================================================
-- Tabelas
-- =========================================================

-- perfil do utilizador (login por nome de utilizador + PIN)
create table profiles (
  id uuid primary key references auth.users not null,
  username text unique not null,
  pin_hash text not null,          -- hash do PIN, nunca guardar em texto simples
  created_at timestamptz default now()
);

-- gastos
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category text not null,          -- 'alimentacao' | 'gasolina' | 'casa' | 'lazer' | 'outros'
  amount numeric not null,
  description text,
  spent_at date not null default current_date,
  created_at timestamptz default now()
);

-- tarefas
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  priority text default 'media',   -- 'baixa' | 'media' | 'alta'
  status text default 'por_fazer', -- 'por_fazer' | 'em_curso' | 'feito'
  due_date date,
  created_at timestamptz default now()
);

-- eventos de calendário
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  event_date date not null,
  event_time time,
  linked_task_id uuid references tasks(id),
  created_at timestamptz default now()
);

-- tipos de lembrete/hábito — o utilizador cria os que quiser (água, medicação, exercício...)
create table reminder_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,              -- 'Água', 'Vitamina D', 'Caminhada'...
  unit text default 'vez',         -- 'copos', 'comprimidos', 'vezes'...
  daily_goal int,                  -- opcional
  interval_hours int,              -- de quanto em quanto tempo lembrar (opcional)
  color text default 'teal',
  active boolean default true,
  created_at timestamptz default now()
);

-- cada registo de um lembrete (independente do tipo)
create table reminder_logs (
  id uuid primary key default gen_random_uuid(),
  reminder_type_id uuid references reminder_types(id) not null,
  user_id uuid references auth.users not null,
  logged_at timestamptz default now(),
  note text                        -- opcional: dose, observação, etc.
);

-- =========================================================
-- Índices
-- =========================================================

create index expenses_user_id_idx on expenses (user_id);
create index tasks_user_id_idx on tasks (user_id);
create index events_user_id_idx on events (user_id);
create index reminder_types_user_id_idx on reminder_types (user_id);
create index reminder_logs_user_id_idx on reminder_logs (user_id);
create index reminder_logs_reminder_type_id_idx on reminder_logs (reminder_type_id);

-- =========================================================
-- Row Level Security — cada utilizador só vê/edita os seus dados
-- =========================================================

alter table profiles enable row level security;
alter table expenses enable row level security;
alter table tasks enable row level security;
alter table events enable row level security;
alter table reminder_types enable row level security;
alter table reminder_logs enable row level security;

-- profiles: a chave primária é o próprio id do utilizador (auth.uid())
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());
create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());
create policy "profiles_delete_own" on profiles
  for delete using (id = auth.uid());

-- expenses
create policy "expenses_select_own" on expenses
  for select using (user_id = auth.uid());
create policy "expenses_insert_own" on expenses
  for insert with check (user_id = auth.uid());
create policy "expenses_update_own" on expenses
  for update using (user_id = auth.uid());
create policy "expenses_delete_own" on expenses
  for delete using (user_id = auth.uid());

-- tasks
create policy "tasks_select_own" on tasks
  for select using (user_id = auth.uid());
create policy "tasks_insert_own" on tasks
  for insert with check (user_id = auth.uid());
create policy "tasks_update_own" on tasks
  for update using (user_id = auth.uid());
create policy "tasks_delete_own" on tasks
  for delete using (user_id = auth.uid());

-- events
create policy "events_select_own" on events
  for select using (user_id = auth.uid());
create policy "events_insert_own" on events
  for insert with check (user_id = auth.uid());
create policy "events_update_own" on events
  for update using (user_id = auth.uid());
create policy "events_delete_own" on events
  for delete using (user_id = auth.uid());

-- reminder_types
create policy "reminder_types_select_own" on reminder_types
  for select using (user_id = auth.uid());
create policy "reminder_types_insert_own" on reminder_types
  for insert with check (user_id = auth.uid());
create policy "reminder_types_update_own" on reminder_types
  for update using (user_id = auth.uid());
create policy "reminder_types_delete_own" on reminder_types
  for delete using (user_id = auth.uid());

-- reminder_logs
create policy "reminder_logs_select_own" on reminder_logs
  for select using (user_id = auth.uid());
create policy "reminder_logs_insert_own" on reminder_logs
  for insert with check (user_id = auth.uid());
create policy "reminder_logs_update_own" on reminder_logs
  for update using (user_id = auth.uid());
create policy "reminder_logs_delete_own" on reminder_logs
  for delete using (user_id = auth.uid());

-- =========================================================
-- Disponibilidade de nome de utilizador
-- =========================================================
-- A tabela profiles está protegida por RLS (só o próprio utilizador vê a
-- sua linha), mas o formulário de registo precisa de verificar se um
-- username já existe *antes* de o utilizador ter sessão. Esta função
-- corre com os privilégios do owner (security definer), devolve apenas
-- um booleano e não expõe pin_hash nem outros dados.
create or replace function public.is_username_available(check_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from profiles where username = lower(check_username)
  );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
