-- Notificações reais (Web Push) para eventos do calendário.
-- notify_lead_hours: quantas horas antes do evento é que os avisos
-- diários começam (ex: 3 dias antes = 72; 5 horas antes = 5).
-- A Edge Function (cron diário) decide, para cada evento com este campo
-- preenchido, se hoje já está dentro da janela de aviso, e evita repetir
-- no mesmo dia através de event_notifications_sent.

alter table events
  add column notify_lead_hours int check (notify_lead_hours is null or notify_lead_hours > 0);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create index push_subscriptions_user_id_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on push_subscriptions
  for select using (user_id = auth.uid());
create policy "push_subscriptions_insert_own" on push_subscriptions
  for insert with check (user_id = auth.uid());
create policy "push_subscriptions_delete_own" on push_subscriptions
  for delete using (user_id = auth.uid());

-- Registo do que já foi notificado hoje, para não repetir o aviso no
-- mesmo dia. Só a Edge Function (service role) lê/escreve aqui — por
-- isso RLS fica ligada mas sem políticas para anon/authenticated.
create table event_notifications_sent (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  notified_date date not null,
  created_at timestamptz default now(),
  unique (event_id, notified_date)
);

alter table event_notifications_sent enable row level security;
