-- Módulo Treinos: planos de treino (com exercícios ordenados), sessões
-- (a partir de um plano ou livres, com o que foi realmente feito por
-- exercício) e metas com progresso.

create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);

create table plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references workout_plans(id) on delete cascade not null,
  name text not null,
  sets int not null,
  reps int not null,
  rest_seconds int not null default 60,
  position int not null default 0,
  created_at timestamptz default now()
);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plan_id uuid references workout_plans(id) on delete set null,
  started_at timestamptz default now(),
  duration_minutes int,
  created_at timestamptz default now()
);

-- exercícios de uma sessão concreta: nome copiado do plano (ou escrito à
-- mão numa sessão livre) na altura, para o histórico não mudar se o
-- plano for depois editado. sets/reps/weight ficam null até serem
-- registados; rest_seconds vem do plano mas é editável na sessão.
create table session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade not null,
  name text not null,
  position int not null default 0,
  sets int,
  reps int,
  weight numeric,
  rest_seconds int not null default 60,
  created_at timestamptz default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  target_value numeric not null,
  current_value numeric not null default 0,
  unit text not null default '',
  deadline date,
  status text not null default 'ativa',  -- 'ativa' | 'concluida' | 'cancelada'
  created_at timestamptz default now()
);

create index workout_plans_user_id_idx on workout_plans (user_id);
create index plan_exercises_plan_id_idx on plan_exercises (plan_id);
create index workout_sessions_user_id_idx on workout_sessions (user_id);
create index session_exercises_session_id_idx on session_exercises (session_id);
create index goals_user_id_idx on goals (user_id);

alter table workout_plans enable row level security;
alter table plan_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table session_exercises enable row level security;
alter table goals enable row level security;

-- workout_plans
create policy "workout_plans_select_own" on workout_plans
  for select using (user_id = auth.uid());
create policy "workout_plans_insert_own" on workout_plans
  for insert with check (user_id = auth.uid());
create policy "workout_plans_update_own" on workout_plans
  for update using (user_id = auth.uid());
create policy "workout_plans_delete_own" on workout_plans
  for delete using (user_id = auth.uid());

-- plan_exercises: dono é o do plano a que pertence (não tem user_id próprio)
create policy "plan_exercises_select_own" on plan_exercises
  for select using (exists (
    select 1 from workout_plans where workout_plans.id = plan_exercises.plan_id and workout_plans.user_id = auth.uid()
  ));
create policy "plan_exercises_insert_own" on plan_exercises
  for insert with check (exists (
    select 1 from workout_plans where workout_plans.id = plan_exercises.plan_id and workout_plans.user_id = auth.uid()
  ));
create policy "plan_exercises_update_own" on plan_exercises
  for update using (exists (
    select 1 from workout_plans where workout_plans.id = plan_exercises.plan_id and workout_plans.user_id = auth.uid()
  ));
create policy "plan_exercises_delete_own" on plan_exercises
  for delete using (exists (
    select 1 from workout_plans where workout_plans.id = plan_exercises.plan_id and workout_plans.user_id = auth.uid()
  ));

-- workout_sessions
create policy "workout_sessions_select_own" on workout_sessions
  for select using (user_id = auth.uid());
create policy "workout_sessions_insert_own" on workout_sessions
  for insert with check (user_id = auth.uid());
create policy "workout_sessions_update_own" on workout_sessions
  for update using (user_id = auth.uid());
create policy "workout_sessions_delete_own" on workout_sessions
  for delete using (user_id = auth.uid());

-- session_exercises: dono é o da sessão a que pertence (não tem user_id próprio)
create policy "session_exercises_select_own" on session_exercises
  for select using (exists (
    select 1 from workout_sessions where workout_sessions.id = session_exercises.session_id and workout_sessions.user_id = auth.uid()
  ));
create policy "session_exercises_insert_own" on session_exercises
  for insert with check (exists (
    select 1 from workout_sessions where workout_sessions.id = session_exercises.session_id and workout_sessions.user_id = auth.uid()
  ));
create policy "session_exercises_update_own" on session_exercises
  for update using (exists (
    select 1 from workout_sessions where workout_sessions.id = session_exercises.session_id and workout_sessions.user_id = auth.uid()
  ));
create policy "session_exercises_delete_own" on session_exercises
  for delete using (exists (
    select 1 from workout_sessions where workout_sessions.id = session_exercises.session_id and workout_sessions.user_id = auth.uid()
  ));

-- goals
create policy "goals_select_own" on goals
  for select using (user_id = auth.uid());
create policy "goals_insert_own" on goals
  for insert with check (user_id = auth.uid());
create policy "goals_update_own" on goals
  for update using (user_id = auth.uid());
create policy "goals_delete_own" on goals
  for delete using (user_id = auth.uid());
