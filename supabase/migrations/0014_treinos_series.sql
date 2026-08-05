-- O registo de sessão precisa de guardar cada série à parte (o peso e
-- as repetições mudam de série para série — ex: 1ª série 15kg×20, 2ª
-- série já a 20kg×10), em vez de um único total por exercício.

create table session_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid references session_exercises(id) on delete cascade not null,
  set_number int not null,
  reps int,
  weight numeric,
  created_at timestamptz default now()
);

create index session_sets_session_exercise_id_idx on session_sets (session_exercise_id);

alter table session_sets enable row level security;

create policy "session_sets_select_own" on session_sets
  for select using (exists (
    select 1 from session_exercises
    join workout_sessions on workout_sessions.id = session_exercises.session_id
    where session_exercises.id = session_sets.session_exercise_id and workout_sessions.user_id = auth.uid()
  ));
create policy "session_sets_insert_own" on session_sets
  for insert with check (exists (
    select 1 from session_exercises
    join workout_sessions on workout_sessions.id = session_exercises.session_id
    where session_exercises.id = session_sets.session_exercise_id and workout_sessions.user_id = auth.uid()
  ));
create policy "session_sets_update_own" on session_sets
  for update using (exists (
    select 1 from session_exercises
    join workout_sessions on workout_sessions.id = session_exercises.session_id
    where session_exercises.id = session_sets.session_exercise_id and workout_sessions.user_id = auth.uid()
  ));
create policy "session_sets_delete_own" on session_sets
  for delete using (exists (
    select 1 from session_exercises
    join workout_sessions on workout_sessions.id = session_exercises.session_id
    where session_exercises.id = session_sets.session_exercise_id and workout_sessions.user_id = auth.uid()
  ));

-- sets/reps/weight de session_exercises passam a viver em session_sets (uma linha por série)
alter table session_exercises drop column sets;
alter table session_exercises drop column reps;
alter table session_exercises drop column weight;

-- descanso predefinido passa de 1 para 3 minutos
alter table plan_exercises alter column rest_seconds set default 180;
alter table session_exercises alter column rest_seconds set default 180;
