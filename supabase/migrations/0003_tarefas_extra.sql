-- Módulo Tarefas: recorrência, subtarefas e etiquetas.
-- Ver docs/ESTRUTURA_PROJETO.md secção 5 (Tarefas).

alter table tasks
  add column recurrence text check (recurrence is null or recurrence in ('diaria', 'semanal', 'mensal'));

create table subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade not null,
  title text not null,
  done boolean not null default false,
  created_at timestamptz default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

create table task_tags (
  task_id uuid references tasks(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (task_id, tag_id)
);

create index subtasks_task_id_idx on subtasks (task_id);
create index tags_user_id_idx on tags (user_id);
create index task_tags_task_id_idx on task_tags (task_id);
create index task_tags_tag_id_idx on task_tags (tag_id);

alter table subtasks enable row level security;
alter table tags enable row level security;
alter table task_tags enable row level security;

-- subtasks: sem user_id próprio — a posse vem da tarefa-mãe.
create policy "subtasks_select_own" on subtasks
  for select using (
    exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid())
  );
create policy "subtasks_insert_own" on subtasks
  for insert with check (
    exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid())
  );
create policy "subtasks_update_own" on subtasks
  for update using (
    exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid())
  );
create policy "subtasks_delete_own" on subtasks
  for delete using (
    exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid())
  );

-- tags
create policy "tags_select_own" on tags
  for select using (user_id = auth.uid());
create policy "tags_insert_own" on tags
  for insert with check (user_id = auth.uid());
create policy "tags_update_own" on tags
  for update using (user_id = auth.uid());
create policy "tags_delete_own" on tags
  for delete using (user_id = auth.uid());

-- task_tags: junção — exige que a tarefa e a etiqueta sejam ambas do utilizador.
create policy "task_tags_select_own" on task_tags
  for select using (
    exists (select 1 from tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid())
  );
create policy "task_tags_insert_own" on task_tags
  for insert with check (
    exists (select 1 from tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid())
    and exists (select 1 from tags where tags.id = task_tags.tag_id and tags.user_id = auth.uid())
  );
create policy "task_tags_delete_own" on task_tags
  for delete using (
    exists (select 1 from tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid())
  );
