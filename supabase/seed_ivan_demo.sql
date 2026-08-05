-- Dados de demonstração para a conta "ivan" — não é uma migration de
-- schema, é só para veres o site preenchido. Podes apagar tudo depois
-- com o DELETE no fundo deste ficheiro (comentado).

do $$
declare
  v_user_id uuid;
  v_tag_casa uuid;
  v_tag_trabalho uuid;
  v_tag_urgente uuid;
  v_task1 uuid;
  v_task2 uuid;
  v_task5 uuid;
  v_reminder_agua uuid;
  v_reminder_exercicio uuid;
  v_plan_a uuid;
  v_plan_b uuid;
  v_session1 uuid;
  v_session2 uuid;
  v_session3 uuid;
begin
  select id into v_user_id from profiles where username = 'ivan';
  if v_user_id is null then
    raise exception 'Utilizador "ivan" não encontrado em profiles.';
  end if;

  -- Etiquetas
  insert into tags (user_id, name) values (v_user_id, 'Casa') returning id into v_tag_casa;
  insert into tags (user_id, name) values (v_user_id, 'Trabalho') returning id into v_tag_trabalho;
  insert into tags (user_id, name) values (v_user_id, 'Urgente') returning id into v_tag_urgente;

  -- Tarefas
  insert into tasks (user_id, title, priority, status, due_date)
    values (v_user_id, 'Preparar apresentação', 'alta', 'em_curso', current_date)
    returning id into v_task1;
  insert into task_tags (task_id, tag_id) values (v_task1, v_tag_trabalho), (v_task1, v_tag_urgente);
  insert into subtasks (task_id, title, done) values
    (v_task1, 'Rever slides', true),
    (v_task1, 'Enviar para revisão', false);

  insert into tasks (user_id, title, priority, status, due_date, recurrence)
    values (v_user_id, 'Pagar renda', 'alta', 'por_fazer', current_date - 4, 'mensal')
    returning id into v_task2;
  insert into task_tags (task_id, tag_id) values (v_task2, v_tag_casa);

  insert into tasks (user_id, title, priority, status, due_date)
    values (v_user_id, 'Ir ao dentista', 'media', 'por_fazer', current_date + 7);

  insert into tasks (user_id, title, priority, status)
    values (v_user_id, 'Ler livro', 'baixa', 'em_curso');

  insert into tasks (user_id, title, priority, status, due_date, recurrence)
    values (v_user_id, 'Tirar o lixo', 'baixa', 'feito', current_date - 1, 'semanal')
    returning id into v_task5;
  insert into task_tags (task_id, tag_id) values (v_task5, v_tag_casa);

  insert into tasks (user_id, title, priority, status, due_date)
    values (v_user_id, 'Responder emails', 'media', 'por_fazer', current_date + 1);

  -- Gastos (mês atual)
  insert into expenses (user_id, category, amount, description, spent_at, recurring) values
    (v_user_id, 'alimentacao', 45.30, 'Supermercado', current_date - 4, false),
    (v_user_id, 'alimentacao', 12.50, 'Café', current_date - 2, false),
    (v_user_id, 'gasolina', 60.00, 'Depósito', current_date - 3, false),
    (v_user_id, 'casa', 350.00, 'Renda', current_date - 4, true),
    (v_user_id, 'casa', 25.00, 'Eletricidade', current_date - 1, false),
    (v_user_id, 'lazer', 18.00, 'Cinema', current_date - 2, false),
    (v_user_id, 'outros', 30.00, 'Presente', current_date - 3, false);

  -- Orçamentos (para veres o aviso de 80%/100%)
  insert into budgets (user_id, category, monthly_limit) values
    (v_user_id, 'alimentacao', 200),
    (v_user_id, 'casa', 400),
    (v_user_id, 'lazer', 50);

  -- Eventos
  insert into events (user_id, title, event_date, event_time, category) values
    (v_user_id, 'Consulta médica', current_date, '15:30', 'Saúde'),
    (v_user_id, 'Reunião de equipa', current_date + 1, '10:00', 'Trabalho'),
    (v_user_id, 'Jantar com amigos', current_date + 2, '20:00', 'Pessoal');

  -- Lembretes
  insert into reminder_types (user_id, name, unit, daily_goal, interval_hours, color, active)
    values (v_user_id, 'Água', 'copos', 8, 2, 'teal', true)
    returning id into v_reminder_agua;

  insert into reminder_types (user_id, name, unit, daily_goal, interval_hours, color, active)
    values (v_user_id, 'Exercício', 'vez', 1, null, 'orange', true)
    returning id into v_reminder_exercicio;

  -- Água: hoje ainda não bateu a meta (3/8), ontem e anteontem bateram (streak = 2)
  insert into reminder_logs (reminder_type_id, user_id, logged_at) values
    (v_reminder_agua, v_user_id, (current_date) + time '09:00'),
    (v_reminder_agua, v_user_id, (current_date) + time '11:30'),
    (v_reminder_agua, v_user_id, (current_date) + time '14:00'),
    (v_reminder_agua, v_user_id, (current_date - 1) + time '09:00'),
    (v_reminder_agua, v_user_id, (current_date - 1) + time '10:30'),
    (v_reminder_agua, v_user_id, (current_date - 1) + time '12:00'),
    (v_reminder_agua, v_user_id, (current_date - 1) + time '14:00'),
    (v_reminder_agua, v_user_id, (current_date - 1) + time '16:00'),
    (v_reminder_agua, v_user_id, (current_date - 1) + time '18:00'),
    (v_reminder_agua, v_user_id, (current_date - 1) + time '20:00'),
    (v_reminder_agua, v_user_id, (current_date - 1) + time '21:30'),
    (v_reminder_agua, v_user_id, (current_date - 2) + time '09:00'),
    (v_reminder_agua, v_user_id, (current_date - 2) + time '11:00'),
    (v_reminder_agua, v_user_id, (current_date - 2) + time '13:00'),
    (v_reminder_agua, v_user_id, (current_date - 2) + time '15:00'),
    (v_reminder_agua, v_user_id, (current_date - 2) + time '17:00'),
    (v_reminder_agua, v_user_id, (current_date - 2) + time '19:00'),
    (v_reminder_agua, v_user_id, (current_date - 2) + time '20:30'),
    (v_reminder_agua, v_user_id, (current_date - 2) + time '22:00');

  -- Exercício: ontem feito (streak = 1), hoje ainda não
  insert into reminder_logs (reminder_type_id, user_id, logged_at) values
    (v_reminder_exercicio, v_user_id, (current_date - 1) + time '18:00');

  -- Treinos: planos com exercícios ordenados
  insert into workout_plans (user_id, name) values (v_user_id, 'Treino A – Peito/Tríceps') returning id into v_plan_a;
  insert into plan_exercises (plan_id, name, sets, reps, rest_seconds, position) values
    (v_plan_a, 'Supino reto', 4, 8, 90, 0),
    (v_plan_a, 'Fundos', 3, 12, 60, 1),
    (v_plan_a, 'Extensão de tríceps', 3, 12, 45, 2);

  insert into workout_plans (user_id, name) values (v_user_id, 'Treino B – Costas/Bíceps') returning id into v_plan_b;
  insert into plan_exercises (plan_id, name, sets, reps, rest_seconds, position) values
    (v_plan_b, 'Remada curvada', 4, 8, 90, 0),
    (v_plan_b, 'Puxada alta', 3, 10, 60, 1),
    (v_plan_b, 'Rosca direta', 3, 12, 45, 2);

  -- Sessões já feitas (histórico), com o que foi realmente feito
  insert into workout_sessions (user_id, plan_id, started_at, duration_minutes)
    values (v_user_id, v_plan_a, (current_date - 5) + time '18:00', 52)
    returning id into v_session1;
  insert into session_exercises (session_id, name, position, sets, reps, weight, rest_seconds) values
    (v_session1, 'Supino reto', 0, 4, 8, 60, 90),
    (v_session1, 'Fundos', 1, 3, 12, null, 60),
    (v_session1, 'Extensão de tríceps', 2, 3, 12, 15, 45);

  insert into workout_sessions (user_id, plan_id, started_at, duration_minutes)
    values (v_user_id, v_plan_b, (current_date - 3) + time '19:00', 48)
    returning id into v_session2;
  insert into session_exercises (session_id, name, position, sets, reps, weight, rest_seconds) values
    (v_session2, 'Remada curvada', 0, 4, 8, 50, 90),
    (v_session2, 'Puxada alta', 1, 3, 10, 45, 60),
    (v_session2, 'Rosca direta', 2, 3, 12, 12, 45);

  -- Sessão livre (sem plano), ex: corrida
  insert into workout_sessions (user_id, plan_id, started_at, duration_minutes)
    values (v_user_id, null, (current_date - 1) + time '07:30', 30)
    returning id into v_session3;
  insert into session_exercises (session_id, name, position, rest_seconds) values
    (v_session3, 'Corrida', 0, 60);

  -- Metas: uma perto do prazo (mostra o destaque a vermelho), uma a meio e uma já concluída
  insert into goals (user_id, title, target_value, current_value, unit, deadline, status) values
    (v_user_id, 'Supino 100kg', 100, 85, 'kg', current_date + 2, 'ativa'),
    (v_user_id, 'Correr 10km sem parar', 10, 6, 'km', current_date + 30, 'ativa'),
    (v_user_id, '50 flexões seguidas', 50, 50, 'reps', current_date - 10, 'concluida');

end $$;

-- Para limpar tudo isto depois, corre (substitui pelo teu username se for diferente):
--
-- do $$
-- declare v_user_id uuid;
-- begin
--   select id into v_user_id from profiles where username = 'ivan';
--   delete from goals where user_id = v_user_id;
--   delete from workout_sessions where user_id = v_user_id; -- arrasta session_exercises por cascade
--   delete from workout_plans where user_id = v_user_id; -- arrasta plan_exercises por cascade
--   delete from reminder_logs where user_id = v_user_id;
--   delete from reminder_types where user_id = v_user_id;
--   delete from events where user_id = v_user_id;
--   delete from budgets where user_id = v_user_id;
--   delete from expenses where user_id = v_user_id;
--   delete from tasks where user_id = v_user_id; -- arrasta subtasks e task_tags por cascade
--   delete from tags where user_id = v_user_id;
-- end $$;
