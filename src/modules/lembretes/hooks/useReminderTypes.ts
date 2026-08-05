import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { NewReminderTypeInput, ReminderType, ReminderTypeUpdateInput } from "../types";

interface MutationResult {
  error: string | null;
}

interface UseReminderTypesResult {
  reminderTypes: ReminderType[];
  activeReminderTypes: ReminderType[];
  loading: boolean;
  error: string | null;
  createReminderType: (input: NewReminderTypeInput) => Promise<MutationResult>;
  updateReminderType: (id: string, input: ReminderTypeUpdateInput) => Promise<MutationResult>;
  deleteReminderType: (id: string) => Promise<MutationResult>;
}

/** CRUD de tipos de lembrete — desativar preserva o histórico; eliminar arrasta-o. */
export function useReminderTypes(): UseReminderTypesResult {
  const { user } = useAuth();
  const [reminderTypes, setReminderTypes] = useState<ReminderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setReminderTypes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("reminder_types")
      .select("*")
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar os tipos de lembrete.");
    } else {
      setReminderTypes((data ?? []) as ReminderType[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function createReminderType(input: NewReminderTypeInput): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    const { error: insertError } = await supabase.from("reminder_types").insert({
      user_id: user.id,
      name: input.name,
      unit: input.unit,
      daily_goal: input.daily_goal,
      interval_hours: input.interval_hours,
      color: input.color,
    });

    if (insertError) {
      return { error: "Não foi possível criar o tipo de lembrete." };
    }

    await load();
    return { error: null };
  }

  async function updateReminderType(id: string, input: ReminderTypeUpdateInput): Promise<MutationResult> {
    const { error: updateError } = await supabase.from("reminder_types").update(input).eq("id", id);

    if (updateError) {
      return { error: "Não foi possível atualizar o tipo de lembrete." };
    }

    await load();
    return { error: null };
  }

  async function deleteReminderType(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("reminder_types").delete().eq("id", id);

    if (deleteError) {
      return { error: "Não foi possível eliminar o tipo de lembrete." };
    }

    await load();
    return { error: null };
  }

  const activeReminderTypes = reminderTypes.filter((type) => type.active);

  return {
    reminderTypes,
    activeReminderTypes,
    loading,
    error,
    createReminderType,
    updateReminderType,
    deleteReminderType,
  };
}
