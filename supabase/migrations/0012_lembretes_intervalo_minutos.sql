-- O formulário passa a deixar escolher o intervalo em minutos ou horas
-- (ex: 30 min = 0.5), por isso interval_hours precisa de aceitar
-- valores fracionários em vez de só inteiros.

alter table reminder_types
  alter column interval_hours type numeric using interval_hours::numeric;
