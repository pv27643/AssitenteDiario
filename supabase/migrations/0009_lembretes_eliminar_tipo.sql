-- Módulo Lembretes: permitir eliminar um tipo de lembrete a sério (além
-- de desativar). Eliminar um tipo arrasta o histórico de registos desse
-- tipo (reminder_logs) — ao contrário de desativar, que preserva tudo.

alter table reminder_logs drop constraint if exists reminder_logs_reminder_type_id_fkey;

alter table reminder_logs
  add constraint reminder_logs_reminder_type_id_fkey
  foreign key (reminder_type_id) references reminder_types(id) on delete cascade;
