-- Agenda a Edge Function send-event-reminders para correr todos os dias.
-- Precisa das extensões pg_cron e pg_net ativas (Database → Extensions
-- no painel do Supabase, ou "create extension" abaixo).
--
-- Substitui:
--   <PROJECT_REF>            pelo teu project ref (tnflgxanqltltzywqdnm)
--   <SERVICE_ROLE_KEY>       pela tua service_role key (Project Settings → API)
--   '0 8 * * *'              se quiseres outra hora (está em UTC; 8h UTC = 9h em Portugal no inverno, 10h no verão)

create extension if not exists pg_cron;
create extension if not exists pg_net;

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

-- Para veres os jobs agendados:
-- select * from cron.job;
--
-- Para apagar este agendamento, se precisares:
-- select cron.unschedule('send-event-reminders-daily');
