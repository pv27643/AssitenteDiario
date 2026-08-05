import { useState } from "react";
import { useWorkoutPlans } from "./hooks/useWorkoutPlans";
import { useWorkoutSessions } from "./hooks/useWorkoutSessions";
import { useGoals } from "./hooks/useGoals";
import SessionTab from "./components/SessionTab";
import PlansTab from "./components/PlansTab";
import HistoryTab from "./components/HistoryTab";
import GoalsTab from "./components/GoalsTab";

type Tab = "sessao" | "planos" | "historico" | "metas";

const TABS: { value: Tab; label: string }[] = [
  { value: "sessao", label: "Sessão" },
  { value: "planos", label: "Planos" },
  { value: "historico", label: "Histórico" },
  { value: "metas", label: "Metas" },
];

function tabButtonClass(isActive: boolean): string {
  return `min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
  }`;
}

export default function TreinosPage() {
  const [tab, setTab] = useState<Tab>("sessao");

  const plans = useWorkoutPlans();
  const sessions = useWorkoutSessions();
  const goals = useGoals();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-white">Treinos</h1>

      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTab(option.value)}
            className={tabButtonClass(tab === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === "sessao" && (
        <SessionTab
          plans={plans.plans}
          sessions={sessions.sessions}
          loading={sessions.loading}
          error={sessions.error}
          startSession={sessions.startSession}
          addSessionExercise={sessions.addSessionExercise}
          deleteSessionExercise={sessions.deleteSessionExercise}
          addSessionSet={sessions.addSessionSet}
          updateSessionSet={sessions.updateSessionSet}
          deleteSessionSet={sessions.deleteSessionSet}
          finishSession={sessions.finishSession}
        />
      )}

      {tab === "planos" && (
        <PlansTab
          plans={plans.plans}
          loading={plans.loading}
          error={plans.error}
          createPlan={plans.createPlan}
          renamePlan={plans.renamePlan}
          deletePlan={plans.deletePlan}
          addPlanExercise={plans.addPlanExercise}
          updatePlanExercise={plans.updatePlanExercise}
          deletePlanExercise={plans.deletePlanExercise}
          movePlanExercise={plans.movePlanExercise}
        />
      )}

      {tab === "historico" && (
        <HistoryTab sessions={sessions.sessions} loading={sessions.loading} deleteSession={sessions.deleteSession} />
      )}

      {tab === "metas" && (
        <GoalsTab
          goals={goals.goals}
          loading={goals.loading}
          error={goals.error}
          createGoal={goals.createGoal}
          updateGoal={goals.updateGoal}
          deleteGoal={goals.deleteGoal}
        />
      )}
    </div>
  );
}
