import { useState } from "react";
import GoalForm from "./GoalForm";
import GoalCard from "./GoalCard";
import type { Goal, GoalUpdateInput, NewGoalInput } from "../types";

interface GoalsTabProps {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  createGoal: (input: NewGoalInput) => Promise<{ error: string | null }>;
  updateGoal: (id: string, input: GoalUpdateInput) => Promise<{ error: string | null }>;
  deleteGoal: (id: string) => Promise<{ error: string | null }>;
}

export default function GoalsTab({ goals, loading, error, createGoal, updateGoal, deleteGoal }: GoalsTabProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setShowForm((prev) => !prev)}
        className="min-h-11 w-full rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
      >
        {showForm ? "Fechar" : "Nova meta"}
      </button>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <GoalForm
            onSubmit={async (input) => {
              const result = await createGoal(input);
              if (!result.error) setShowForm(false);
              return result;
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">A carregar...</p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-zinc-500">Ainda não criaste nenhuma meta.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdate={(input) => updateGoal(goal.id, input)}
              onDelete={() => deleteGoal(goal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
