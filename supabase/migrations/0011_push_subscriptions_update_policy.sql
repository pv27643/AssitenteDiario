-- Faltava a política de UPDATE em push_subscriptions. O subscribe() do
-- frontend faz um upsert (onConflict: "endpoint"), que ao encontrar uma
-- subscrição já existente para o mesmo dispositivo faz um UPDATE por
-- baixo — sem esta política, o RLS bloqueia e dá "Não foi possível
-- guardar a subscrição de notificações."

create policy "push_subscriptions_update_own" on push_subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
