import { useState } from "react";
import PlanCard from "./PlanCard";
import type { NewPlanExerciseInput, PlanExerciseUpdateInput, PlanWithExercises } from "../types";

interface PlansTabProps {
  plans: PlanWithExercises[];
  loading: boolean;
  error: string | null;
  createPlan: (input: { name: string; exercises: NewPlanExerciseInput[] }) => Promise<{ error: string | null }>;
  renamePlan: (id: string, name: string) => Promise<{ error: string | null }>;
  deletePlan: (id: string) => Promise<{ error: string | null }>;
  addPlanExercise: (planId: string, input: NewPlanExerciseInput) => Promise<{ error: string | null }>;
  updatePlanExercise: (id: string, input: PlanExerciseUpdateInput) => Promise<{ error: string | null }>;
  deletePlanExercise: (id: string) => Promise<{ error: string | null }>;
  movePlanExercise: (planId: string, exerciseId: string, direction: "cima" | "baixo") => Promise<{ error: string | null }>;
}

export default function PlansTab({
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
}: PlansTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCreate() {
    if (!newPlanName.trim()) return;
    const { error: createError } = await createPlan({ name: newPlanName.trim(), exercises: [] });
    if (createError) {
      setActionError(createError);
      return;
    }
    setNewPlanName("");
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setShowForm((prev) => !prev)}
        className="min-h-11 w-full rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
      >
        {showForm ? "Fechar" : "Novo plano"}
      </button>

      {showForm && (
        <div className="flex gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <input
            type="text"
            placeholder="Nome do plano"
            value={newPlanName}
            onChange={(event) => setNewPlanName(event.target.value)}
            className="min-h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="min-h-11 shrink-0 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Criar
          </button>
        </div>
      )}

      {(error || actionError) && <p className="text-sm text-red-500">{error ?? actionError}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">A carregar...</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-zinc-500">Ainda não criaste nenhum plano de treino.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onRename={(name) => renamePlan(plan.id, name)}
              onDelete={() => deletePlan(plan.id)}
              onAddExercise={(input) => addPlanExercise(plan.id, input)}
              onUpdateExercise={(id, input) => updatePlanExercise(id, input)}
              onDeleteExercise={(id) => deletePlanExercise(id)}
              onMoveExercise={(id, direction) => movePlanExercise(plan.id, id, direction)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
