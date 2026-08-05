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

end $$;

-- Para limpar tudo isto depois, corre (substitui pelo teu username se for diferente):
--
-- do $$
-- declare v_user_id uuid;
-- begin
--   select id into v_user_id from profiles where username = 'ivan';
--   delete from reminder_logs where user_id = v_user_id;
--   delete from reminder_types where user_id = v_user_id;
--   delete from events where user_id = v_user_id;
--   delete from budgets where user_id = v_user_id;
--   delete from expenses where user_id = v_user_id;
--   delete from tasks where user_id = v_user_id; -- arrasta subtasks e task_tags por cascade
--   delete from tags where user_id = v_user_id;
-- end $$;
