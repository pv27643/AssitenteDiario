-- Agenda as duas Edge Functions de notificações para correrem sozinhas.
-- Precisa das extensões pg_cron e pg_net ativas (criadas abaixo).
--
-- Substitui antes de correr:
--   <PROJECT_REF>       pelo teu project ref (tnflgxanqltltzywqdnm)
--   <SERVICE_ROLE_KEY>  pela tua service_role key (Project Settings → API)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Eventos do Calendário: uma vez por dia (8h UTC = 9h em PT no inverno, 10h no verão).
select cron.schedule(
  'send-event-reminders-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Tipos de lembrete (interval_hours): de hora a hora, para apanhar
-- qualquer intervalo definido em horas com boa precisão.
select cron.schedule(
  'send-reminder-notifications-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminder-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para veres os jobs agendados:
-- select * from cron.job;
--
-- Para apagar um agendamento, se precisares:
-- select cron.unschedule('send-event-reminders-daily');
-- select cron.unschedule('send-reminder-notifications-hourly');
