import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { ReminderLog } from "../types";

interface MutationResult {
  error: string | null;
}

interface UseReminderLogsResult {
  logs: ReminderLog[];
  loading: boolean;
  error: string | null;
  addLog: (note?: string) => Promise<MutationResult>;
}

/** Histórico completo (registo + listagem) de um tipo de lembrete específico. */
export function useReminderLogs(reminderTypeId: string): UseReminderLogsResult {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("reminder_logs")
      .select("*")
      .eq("reminder_type_id", reminderTypeId)
      .order("logged_at", { ascending: false });

    if (fetchError) {
      setError("Não foi possível carregar o histórico.");
    } else {
      setLogs((data ?? []) as ReminderLog[]);
    }

    setLoading(false);
  }, [user, reminderTypeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addLog(note?: string): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    const { error: insertError } = await supabase.from("reminder_logs").insert({
      reminder_type_id: reminderTypeId,
      user_id: user.id,
      note: note || null,
    });

    if (insertError) {
      return { error: "Não foi possível registar." };
    }

    await load();
    return { error: null };
  }

  return { logs, loading, error, addLog };
}
