import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";

interface UsePushNotificationsResult {
  supported: boolean;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

// O service worker fica em public/sw.js, servido a partir da raiz do
// deploy (que pode ser um subcaminho, ex: GitHub Pages) — BASE_URL já
// vem com "/" no fim.
const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Ativa/desativa notificações push reais (Web Push), guardando a subscrição do dispositivo em push_subscriptions. */
export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useAuth();
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) {
      setLoading(false);
      return;
    }

    navigator.serviceWorker
      .register(SW_URL)
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(subscription !== null))
      .catch(() => setSubscribed(false))
      .finally(() => setLoading(false));
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !user) return;
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Permissão de notificações recusada.");
        return;
      }

      const registration = await navigator.serviceWorker.register(SW_URL);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY) as BufferSource,
      });

      const json = subscription.toJSON();
      const { error: insertError } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        },
        { onConflict: "endpoint" },
      );

      if (insertError) {
        setError("Não foi possível guardar a subscrição de notificações.");
        return;
      }

      setSubscribed(true);
    } catch {
      setError("Não foi possível ativar as notificações.");
    }
  }, [supported, user]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setError(null);

    try {
      const registration = await navigator.serviceWorker.register(SW_URL);
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }

      setSubscribed(false);
    } catch {
      setError("Não foi possível desativar as notificações.");
    }
  }, [supported]);

  return { supported, subscribed, loading, error, subscribe, unsubscribe };
}
