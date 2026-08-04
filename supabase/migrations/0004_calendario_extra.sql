-- Módulo Calendário: categoria definida pelo utilizador ao criar um evento.
-- Ver docs/ESTRUTURA_PROJETO.md secção 5 (Calendário).

alter table events
  add column category text;
