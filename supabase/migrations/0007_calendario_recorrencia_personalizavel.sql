-- Módulo Calendário: recorrência personalizável (ex: "de 5 em 5 dias"),
-- em vez de só semanal/mensal/anual fixos.
-- Substitui a coluna recurrence (unidade fixa) por recurrence_unit
-- (dias/semanas/meses/anos) + recurrence_interval (o "de quantos em
-- quantos"), preservando os eventos recorrentes já criados.

alter table events drop constraint if exists events_recurrence_check;
alter table events rename column recurrence to recurrence_unit;

alter table events
  add column recurrence_interval int check (recurrence_interval is null or recurrence_interval > 0);

update events set recurrence_interval = 1 where recurrence_unit is not null;

update events set recurrence_unit = case recurrence_unit
  when 'semanal' then 'semanas'
  when 'mensal' then 'meses'
  when 'anual' then 'anos'
  else recurrence_unit
end;

alter table events add constraint events_recurrence_unit_check
  check (recurrence_unit is null or recurrence_unit in ('dias', 'semanas', 'meses', 'anos'));

alter table events add constraint events_recurrence_consistency_check
  check ((recurrence_unit is null) = (recurrence_interval is null));
