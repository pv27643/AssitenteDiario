import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import SessionExerciseRow from "./SessionExerciseRow";
import Timer from "./Timer";
import type { PlanWithExercises, SessionSetInput, SessionWithExercises } from "../types";

const DEFAULT_REST_SECONDS = 180;

interface SessionTabProps {
  plans: PlanWithExercises[];
  sessions: SessionWithExercises[];
  loading: boolean;
  error: string | null;
  startSession: (plan: PlanWithExercises | null) => Promise<{ id: string | null; error: string | null }>;
  addSessionExercise: (
    sessionId: string,
    input: { name: string; rest_seconds: number },
  ) => Promise<{ error: string | null }>;
  deleteSessionExercise: (id: string) => Promise<{ error: string | null }>;
  addSessionSet: (sessionExerciseId: string, input: SessionSetInput) => Promise<{ error: string | null }>;
  updateSessionSet: (id: string, input: SessionSetInput) => Promise<{ error: string | null }>;
  deleteSessionSet: (id: string) => Promise<{ error: string | null }>;
  finishSession: (id: string, durationMinutes: number) => Promise<{ error: string | null }>;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export default function SessionTab({
  plans,
  sessions,
  loading,
  error,
  startSession,
  addSessionExercise,
  deleteSessionExercise,
  addSessionSet,
  updateSessionSet,
  deleteSessionSet,
  finishSession,
}: SessionTabProps) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [restExerciseId, setRestExerciseId] = useState<string | null>(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  async function handleStart(plan: PlanWithExercises | null) {
    setActionError(null);
    const { id, error: startError } = await startSession(plan);
    if (startError && !id) {
      setActionError(startError);
      return;
    }
    setActiveSessionId(id);
  }

  async function handleAddExercise() {
    if (!activeSessionId || !newExerciseName.trim()) return;
    const { error: addError } = await addSessionExercise(activeSessionId, {
      name: newExerciseName.trim(),
      rest_seconds: DEFAULT_REST_SECONDS,
    });
    if (addError) setActionError(addError);
    else setNewExerciseName("");
  }

  async function handleFinish(elapsedSeconds: number) {
    if (!activeSessionId) return;
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const { error: finishError } = await finishSession(activeSessionId, durationMinutes);
    if (finishError) {
      setActionError(finishError);
      return;
    }
    setActiveSessionId(null);
    setRestExerciseId(null);
  }

  if (loading) return <p className="text-sm text-zinc-500">A carregar...</p>;

  if (!activeSession) {
    return (
      <div className="flex flex-col gap-4">
        {(error || actionError) && <p className="text-sm text-red-500">{error ?? actionError}</p>}

        <div className="flex flex-col gap-2">
          <label htmlFor="planSelect" className="text-sm font-medium text-zinc-300">
            Começar a partir de um plano
          </label>
          <div className="flex gap-2">
            <select
              id="planSelect"
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              className={inputClass}
            >
              <option value="">Escolhe um plano...</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedPlanId}
              onClick={() => handleStart(plans.find((plan) => plan.id === selectedPlanId) ?? null)}
              className="min-h-11 shrink-0 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              Começar
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleStart(null)}
          className="min-h-11 w-full rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          Começar sessão livre
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(error || actionError) && <p className="text-sm text-red-500">{error ?? actionError}</p>}

      <div className="flex flex-col gap-3">
        {activeSession.exercises.map((exercise) => (
          <SessionExerciseRow
            key={exercise.id}
            exercise={exercise}
            isResting={restExerciseId === exercise.id}
            onToggleRest={() => setRestExerciseId((prev) => (prev === exercise.id ? null : exercise.id))}
            onAddSet={(input) => addSessionSet(exercise.id, input)}
            onUpdateSet={(id, input) => updateSessionSet(id, input)}
            onDeleteSet={(id) => deleteSessionSet(id)}
            onDeleteExercise={() => deleteSessionExercise(exercise.id)}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nome do exercício"
          value={newExerciseName}
          onChange={(event) => setNewExerciseName(event.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={handleAddExercise}
          aria-label="Adicionar exercício"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-500"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-300">Duração da sessão</p>
        <Timer mode="stopwatch" onStop={handleFinish} />
      </div>
    </div>
  );
}
