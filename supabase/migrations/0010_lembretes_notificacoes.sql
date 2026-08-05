-- Módulo Lembretes: notificações reais, com base no interval_hours que
-- já existia (de quanto em quanto tempo lembrar). last_notified_at
-- guarda quando foi o último aviso enviado, para a Edge Function saber
-- se já passou tempo suficiente desde então (ou desde o último registo).

alter table reminder_types
  add column last_notified_at timestamptz;
