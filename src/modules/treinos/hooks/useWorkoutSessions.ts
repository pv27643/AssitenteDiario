import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type {
  PlanWithExercises,
  SessionExerciseUpdateInput,
  SessionExerciseWithSets,
  SessionSet,
  SessionSetInput,
  SessionWithExercises,
} from "../types";

interface MutationResult {
  error: string | null;
}

interface StartSessionResult {
  id: string | null;
  error: string | null;
}

interface NewSessionExerciseInput {
  name: string;
  rest_seconds: number;
}

interface UseWorkoutSessionsResult {
  sessions: SessionWithExercises[];
  loading: boolean;
  error: string | null;
  startSession: (plan: PlanWithExercises | null) => Promise<StartSessionResult>;
  addSessionExercise: (sessionId: string, input: NewSessionExerciseInput) => Promise<MutationResult>;
  updateSessionExercise: (id: string, input: SessionExerciseUpdateInput) => Promise<MutationResult>;
  deleteSessionExercise: (id: string) => Promise<MutationResult>;
  addSessionSet: (sessionExerciseId: string, input: SessionSetInput) => Promise<MutationResult>;
  updateSessionSet: (id: string, input: SessionSetInput) => Promise<MutationResult>;
  deleteSessionSet: (id: string) => Promise<MutationResult>;
  finishSession: (id: string, durationMinutes: number) => Promise<MutationResult>;
  deleteSession: (id: string) => Promise<MutationResult>;
}

interface RawSessionRow extends SessionWithExercises {
  session_exercises: (SessionExerciseWithSets & { session_sets: SessionSet[] | null })[] | null;
  workout_plans: { name: string } | null;
}

function toSessionWithExercises(row: RawSessionRow): SessionWithExercises {
  const { session_exercises, workout_plans, ...session } = row;
  return {
    ...session,
    plan_name: workout_plans?.name ?? null,
    exercises: (session_exercises ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((exercise) => {
        const { session_sets, ...rest } = exercise;
        return { ...rest, sets: (session_sets ?? []).slice().sort((a, b) => a.set_number - b.set_number) };
      }),
  };
}

/** Sessões de treino: a partir de um plano (exercícios pré-preenchidos) ou livres. */
export function useWorkoutSessions(): UseWorkoutSessionsResult {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("workout_sessions")
      .select("*, workout_plans(name), session_exercises(*, session_sets(*))")
      .order("started_at", { ascending: false });

    if (fetchError) {
      setError("Não foi possível carregar as sessões de treino.");
    } else {
      setSessions(((data ?? []) as unknown as RawSessionRow[]).map(toSessionWithExercises));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function startSession(plan: PlanWithExercises | null): Promise<StartSessionResult> {
    if (!user) return { id: null, error: "Sessão inválida." };

    const { data, error: insertError } = await supabase
      .from("workout_sessions")
      .insert({ user_id: user.id, plan_id: plan?.id ?? null })
      .select("id")
      .single();

    if (insertError || !data) {
      return { id: null, error: "Não foi possível começar a sessão." };
    }

    if (plan) {
      for (let index = 0; index < plan.exercises.length; index++) {
        const planExercise = plan.exercises[index];
        const { data: exerciseData, error: exerciseError } = await supabase
          .from("session_exercises")
          .insert({
            session_id: data.id,
            name: planExercise.name,
            position: index,
            rest_seconds: planExercise.rest_seconds,
          })
          .select("id")
          .single();

        if (exerciseError || !exerciseData) {
          await load();
          return { id: data.id, error: "Sessão criada, mas não foi possível pré-preencher os exercícios." };
        }

        if (planExercise.sets > 0) {
          const { error: setsError } = await supabase.from("session_sets").insert(
            Array.from({ length: planExercise.sets }, (_, setIndex) => ({
              session_exercise_id: exerciseData.id,
              set_number: setIndex + 1,
              reps: planExercise.reps,
              weight: null,
            })),
          );
          if (setsError) {
            await load();
            return { id: data.id, error: "Sessão criada, mas não foi possível pré-preencher as séries." };
          }
        }
      }
    }

    await load();
    return { id: data.id, error: null };
  }

  async function addSessionExercise(sessionId: string, input: NewSessionExerciseInput): Promise<MutationResult> {
    const session = sessions.find((entry) => entry.id === sessionId);
    const nextPosition = session ? session.exercises.length : 0;

    const { error: insertError } = await supabase.from("session_exercises").insert({
      session_id: sessionId,
      name: input.name,
      rest_seconds: input.rest_seconds,
      position: nextPosition,
    });
    if (insertError) return { error: "Não foi possível adicionar o exercício." };
    await load();
    return { error: null };
  }

  async function updateSessionExercise(id: string, input: SessionExerciseUpdateInput): Promise<MutationResult> {
    const { error: updateError } = await supabase.from("session_exercises").update(input).eq("id", id);
    if (updateError) return { error: "Não foi possível atualizar o exercício." };
    await load();
    return { error: null };
  }

  async function deleteSessionExercise(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("session_exercises").delete().eq("id", id);
    if (deleteError) return { error: "Não foi possível remover o exercício." };
    await load();
    return { error: null };
  }

  async function addSessionSet(sessionExerciseId: string, input: SessionSetInput): Promise<MutationResult> {
    let nextSetNumber = 1;
    for (const session of sessions) {
      const exercise = session.exercises.find((entry) => entry.id === sessionExerciseId);
      if (exercise) {
        nextSetNumber = exercise.sets.length + 1;
        break;
      }
    }

    const { error: insertError } = await supabase.from("session_sets").insert({
      session_exercise_id: sessionExerciseId,
      set_number: nextSetNumber,
      reps: input.reps ?? null,
      weight: input.weight ?? null,
    });
    if (insertError) return { error: "Não foi possível adicionar a série." };
    await load();
    return { error: null };
  }

  async function updateSessionSet(id: string, input: SessionSetInput): Promise<MutationResult> {
    const { error: updateError } = await supabase.from("session_sets").update(input).eq("id", id);
    if (updateError) return { error: "Não foi possível atualizar a série." };
    await load();
    return { error: null };
  }

  async function deleteSessionSet(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("session_sets").delete().eq("id", id);
    if (deleteError) return { error: "Não foi possível remover a série." };
    await load();
    return { error: null };
  }

  async function finishSession(id: string, durationMinutes: number): Promise<MutationResult> {
    const { error: updateError } = await supabase
      .from("workout_sessions")
      .update({ duration_minutes: durationMinutes })
      .eq("id", id);
    if (updateError) return { error: "Não foi possível terminar a sessão." };
    await load();
    return { error: null };
  }

  async function deleteSession(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("workout_sessions").delete().eq("id", id);
    if (deleteError) return { error: "Não foi possível eliminar a sessão." };
    await load();
    return { error: null };
  }

  return {
    sessions,
    loading,
    error,
    startSession,
    addSessionExercise,
    updateSessionExercise,
    deleteSessionExercise,
    addSessionSet,
    updateSessionSet,
    deleteSessionSet,
    finishSession,
    deleteSession,
  };
}
