// Edge Function: corre uma vez por dia (via cron) e envia um Web Push
// para cada evento cuja janela de aviso ("notify_lead_hours" antes do
// evento) já começou hoje — uma notificação por evento por dia, nunca
// repetida no mesmo dia (controlado por event_notifications_sent).
//
// Secrets necessários (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente
// no ambiente de qualquer Edge Function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails("mailto:noreply@assistentediario.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addDaysToIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

/** Ocorrências de um evento recorrente que caem em [windowStart, windowEnd] (mesma lógica do cliente). */
function expandOccurrencesInWindow(
  startDate: string,
  unit: string,
  interval: number,
  windowStart: string,
  windowEnd: string,
): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${windowEnd}T00:00:00Z`);
  const step = Math.max(1, Math.floor(interval));
  let iterations = 0;

  while (current <= end && iterations < 1000) {
    const iso = toIsoDate(current);
    if (iso >= windowStart) dates.push(iso);
    if (unit === "dias") current.setUTCDate(current.getUTCDate() + step);
    else if (unit === "semanas") current.setUTCDate(current.getUTCDate() + step * 7);
    else if (unit === "meses") current.setUTCMonth(current.getUTCMonth() + step);
    else current.setUTCFullYear(current.getUTCFullYear() + step);
    iterations += 1;
  }

  return dates;
}

interface EventRow {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  recurrence_unit: string | null;
  recurrence_interval: number | null;
  notify_lead_hours: number;
}

Deno.serve(async () => {
  const today = toIsoDate(new Date());

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, user_id, title, event_date, recurrence_unit, recurrence_interval, notify_lead_hours")
    .not("notify_lead_hours", "is", null);

  if (eventsError) {
    return new Response(JSON.stringify({ error: eventsError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  let sentCount = 0;

  for (const event of (events ?? []) as EventRow[]) {
    const leadDays = Math.max(1, Math.ceil(event.notify_lead_hours / 24));
    const windowStart = addDaysToIso(today, -leadDays);

    const occurrenceDates =
      event.recurrence_unit && event.recurrence_interval
        ? expandOccurrencesInWindow(event.event_date, event.recurrence_unit, event.recurrence_interval, windowStart, today)
        : [event.event_date];

    // A ocorrência cuja janela de aviso (ocorrência - leadDays .. ocorrência) inclui hoje.
    const relevantOccurrence = occurrenceDates.find((occurrenceDate) => {
      const occurrenceWindowStart = addDaysToIso(occurrenceDate, -leadDays);
      return today >= occurrenceWindowStart && today <= occurrenceDate;
    });

    if (!relevantOccurrence) continue;

    const { data: existingLog } = await supabase
      .from("event_notifications_sent")
      .select("id")
      .eq("event_id", event.id)
      .eq("notified_date", today)
      .maybeSingle();

    if (existingLog) continue;

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", event.user_id);

    if (!subscriptions || subscriptions.length === 0) continue;

    const daysUntil = daysBetween(today, relevantOccurrence);
    const body =
      daysUntil <= 0 ? `${event.title} é hoje.` : `${event.title} é daqui a ${daysUntil} dia${daysUntil === 1 ? "" : "s"}.`;

    const payload = JSON.stringify({ title: "Assistente Diário", body, url: "/calendario" });

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
          // Subscrição expirada/inválida (dispositivo desregistado) — remove-a.
          await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        }
      }
    }

    await supabase.from("event_notifications_sent").insert({ event_id: event.id, notified_date: today });
  }

  return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
    headers: { "content-type": "application/json" },
  });
});
