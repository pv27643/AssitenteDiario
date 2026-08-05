import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { NewPlanExerciseInput, PlanExerciseUpdateInput, PlanExercise, PlanWithExercises } from "../types";

interface MutationResult {
  error: string | null;
}

interface NewPlanInput {
  name: string;
  exercises: NewPlanExerciseInput[];
}

interface UseWorkoutPlansResult {
  plans: PlanWithExercises[];
  loading: boolean;
  error: string | null;
  createPlan: (input: NewPlanInput) => Promise<MutationResult>;
  renamePlan: (id: string, name: string) => Promise<MutationResult>;
  deletePlan: (id: string) => Promise<MutationResult>;
  addPlanExercise: (planId: string, input: NewPlanExerciseInput) => Promise<MutationResult>;
  updatePlanExercise: (id: string, input: PlanExerciseUpdateInput) => Promise<MutationResult>;
  deletePlanExercise: (id: string) => Promise<MutationResult>;
  movePlanExercise: (planId: string, exerciseId: string, direction: "cima" | "baixo") => Promise<MutationResult>;
}

interface RawPlanRow extends PlanWithExercises {
  plan_exercises: PlanExercise[] | null;
}

function toPlanWithExercises(row: RawPlanRow): PlanWithExercises {
  const { plan_exercises, ...plan } = row;
  return {
    ...plan,
    exercises: (plan_exercises ?? []).slice().sort((a, b) => a.position - b.position),
  };
}

/** CRUD de planos de treino: nome + lista ordenada de exercícios. */
export function useWorkoutPlans(): UseWorkoutPlansResult {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("workout_plans")
      .select("*, plan_exercises(*)")
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar os planos de treino.");
    } else {
      setPlans(((data ?? []) as unknown as RawPlanRow[]).map(toPlanWithExercises));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function createPlan(input: NewPlanInput): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    const { data, error: insertError } = await supabase
      .from("workout_plans")
      .insert({ user_id: user.id, name: input.name })
      .select("id")
      .single();

    if (insertError || !data) {
      return { error: "Não foi possível criar o plano." };
    }

    if (input.exercises.length > 0) {
      const { error: exercisesError } = await supabase.from("plan_exercises").insert(
        input.exercises.map((exercise, index) => ({
          plan_id: data.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          position: index,
        })),
      );
      if (exercisesError) {
        await load();
        return { error: "Plano criado, mas não foi possível guardar os exercícios." };
      }
    }

    await load();
    return { error: null };
  }

  async function renamePlan(id: string, name: string): Promise<MutationResult> {
    const { error: updateError } = await supabase.from("workout_plans").update({ name }).eq("id", id);
    if (updateError) return { error: "Não foi possível renomear o plano." };
    await load();
    return { error: null };
  }

  async function deletePlan(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("workout_plans").delete().eq("id", id);
    if (deleteError) return { error: "Não foi possível eliminar o plano." };
    await load();
    return { error: null };
  }

  async function addPlanExercise(planId: string, input: NewPlanExerciseInput): Promise<MutationResult> {
    const plan = plans.find((entry) => entry.id === planId);
    const nextPosition = plan ? plan.exercises.length : 0;

    const { error: insertError } = await supabase.from("plan_exercises").insert({
      plan_id: planId,
      name: input.name,
      sets: input.sets,
      reps: input.reps,
      rest_seconds: input.rest_seconds,
      position: nextPosition,
    });
    if (insertError) return { error: "Não foi possível adicionar o exercício." };
    await load();
    return { error: null };
  }

  async function updatePlanExercise(id: string, input: PlanExerciseUpdateInput): Promise<MutationResult> {
    const { error: updateError } = await supabase.from("plan_exercises").update(input).eq("id", id);
    if (updateError) return { error: "Não foi possível atualizar o exercício." };
    await load();
    return { error: null };
  }

  async function deletePlanExercise(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("plan_exercises").delete().eq("id", id);
    if (deleteError) return { error: "Não foi possível remover o exercício." };
    await load();
    return { error: null };
  }

  async function movePlanExercise(
    planId: string,
    exerciseId: string,
    direction: "cima" | "baixo",
  ): Promise<MutationResult> {
    const plan = plans.find((entry) => entry.id === planId);
    if (!plan) return { error: null };

    const index = plan.exercises.findIndex((exercise) => exercise.id === exerciseId);
    const neighborIndex = direction === "cima" ? index - 1 : index + 1;
    if (index === -1 || neighborIndex < 0 || neighborIndex >= plan.exercises.length) return { error: null };

    const current = plan.exercises[index];
    const neighbor = plan.exercises[neighborIndex];

    const [firstUpdate, secondUpdate] = await Promise.all([
      supabase.from("plan_exercises").update({ position: neighbor.position }).eq("id", current.id),
      supabase.from("plan_exercises").update({ position: current.position }).eq("id", neighbor.id),
    ]);

    if (firstUpdate.error || secondUpdate.error) return { error: "Não foi possível reordenar os exercícios." };
    await load();
    return { error: null };
  }

  return {
    plans,
    loading,
    error,
    createPlan,
    renamePlan,
    deletePlan,
    addPlanExercise,
    updatePlanExercise,
    deletePlanExercise,
    movePlanExercise,
  };
}
