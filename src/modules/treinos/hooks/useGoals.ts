import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { Goal, GoalUpdateInput, NewGoalInput } from "../types";

interface MutationResult {
  error: string | null;
}

interface UseGoalsResult {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  createGoal: (input: NewGoalInput) => Promise<MutationResult>;
  updateGoal: (id: string, input: GoalUpdateInput) => Promise<MutationResult>;
  deleteGoal: (id: string) => Promise<MutationResult>;
}

/** CRUD de metas: título, valor-alvo, valor atual, unidade, prazo opcional e estado. */
export function useGoals(): UseGoalsResult {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Não foi possível carregar as metas.");
    } else {
      setGoals((data ?? []) as Goal[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function createGoal(input: NewGoalInput): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    const { error: insertError } = await supabase.from("goals").insert({
      user_id: user.id,
      title: input.title,
      target_value: input.target_value,
      current_value: input.current_value,
      unit: input.unit,
      deadline: input.deadline,
    });

    if (insertError) return { error: "Não foi possível criar a meta." };
    await load();
    return { error: null };
  }

  async function updateGoal(id: string, input: GoalUpdateInput): Promise<MutationResult> {
    const { error: updateError } = await supabase.from("goals").update(input).eq("id", id);
    if (updateError) return { error: "Não foi possível atualizar a meta." };
    await load();
    return { error: null };
  }

  async function deleteGoal(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("goals").delete().eq("id", id);
    if (deleteError) return { error: "Não foi possível eliminar a meta." };
    await load();
    return { error: null };
  }

  return { goals, loading, error, createGoal, updateGoal, deleteGoal };
}
