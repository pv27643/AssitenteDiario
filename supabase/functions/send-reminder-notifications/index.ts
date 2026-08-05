// Edge Function: corre de hora a hora (via cron) e envia um Web Push
// para cada tipo de lembrete ativo com "interval_hours" definido, quando
// já passou tempo suficiente desde o último registo (ou desde o último
// aviso já enviado — o que for mais recente dos dois).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

// Tem de bater certo com o "base" do vite.config.ts.
const APP_BASE_PATH = Deno.env.get("APP_BASE_PATH") ?? "/AssitenteDiario";

webpush.setVapidDetails("mailto:noreply@assistentediario.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface ReminderTypeRow {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  interval_hours: number;
  last_notified_at: string | null;
}

Deno.serve(async () => {
  const now = new Date();

  const { data: reminderTypes, error: typesError } = await supabase
    .from("reminder_types")
    .select("id, user_id, name, unit, interval_hours, last_notified_at")
    .eq("active", true)
    .not("interval_hours", "is", null);

  if (typesError) {
    return new Response(JSON.stringify({ error: typesError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  let sentCount = 0;

  for (const type of (reminderTypes ?? []) as ReminderTypeRow[]) {
    const { data: lastLog } = await supabase
      .from("reminder_logs")
      .select("logged_at")
      .eq("reminder_type_id", type.id)
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastLogTime = lastLog ? new Date(lastLog.logged_at) : null;
    const lastNotifiedTime = type.last_notified_at ? new Date(type.last_notified_at) : null;

    // Referência = o mais recente entre o último registo e o último aviso
    // já enviado — não notifica logo a seguir a um registo, nem repete
    // o aviso antes de passar o intervalo outra vez.
    const reference = [lastLogTime, lastNotifiedTime]
      .filter((date): date is Date => date !== null)
      .reduce((latest, date) => (date > latest ? date : latest), new Date(0));

    const hoursSinceReference = (now.getTime() - reference.getTime()) / 3_600_000;
    if (hoursSinceReference < type.interval_hours) continue;

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", type.user_id);

    if (!subscriptions || subscriptions.length === 0) continue;

    const payload = JSON.stringify({
      title: "Assistente Diário",
      body: `Lembrete: ${type.name} — já passaram mais de ${type.interval_hours}h.`,
      url: `${APP_BASE_PATH}/lembretes`,
    });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
        );
        sentCount += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        }
      }
    }

    await supabase.from("reminder_types").update({ last_notified_at: now.toISOString() }).eq("id", type.id);
  }

  return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
    headers: { "content-type": "application/json" },
  });
});
