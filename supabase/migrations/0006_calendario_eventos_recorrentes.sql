-- Módulo Calendário: eventos recorrentes (semanal/mensal/anual).
-- As ocorrências não são guardadas uma a uma — o evento guarda só a
-- primeira data + a recorrência, e o cliente gera as ocorrências
-- seguintes ao desenhar o calendário (mesmo espírito de "sem duplicar
-- dados" já usado para as tarefas com prazo).

alter table events
  add column recurrence text check (recurrence is null or recurrence in ('semanal', 'mensal', 'anual'));
