import { useMemo, useState } from "react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import { formatDurationMinutes, formatSessionDate, formatSets, groupSessionsByPeriod } from "../utils";
import type { SessionWithExercises } from "../types";

interface HistoryTabProps {
  sessions: SessionWithExercises[];
  loading: boolean;
  deleteSession: (id: string) => Promise<{ error: string | null }>;
}

type Period = "semana" | "mes";

function periodButtonClass(isActive: boolean): string {
  return `min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
  }`;
}

export default function HistoryTab({ sessions, loading, deleteSession }: HistoryTabProps) {
  const [period, setPeriod] = useState<Period>("semana");
  const groups = useMemo(() => groupSessionsByPeriod(sessions, period), [sessions, period]);

  if (loading) return <p className="text-sm text-zinc-500">A carregar...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        <button type="button" onClick={() => setPeriod("semana")} className={periodButtonClass(period === "semana")}>
          Semana
        </button>
        <button type="button" onClick={() => setPeriod("mes")} className={periodButtonClass(period === "mes")}>
          Mês
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-zinc-500">Ainda não tens sessões registadas.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-white">{group.label}</h3>

              {group.sessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{session.plan_name ?? "Sessão livre"}</p>
                      <p className="text-xs text-zinc-500">
                        {formatSessionDate(session.started_at)}
                        {session.duration_minutes !== null
                          ? ` · ${formatDurationMinutes(session.duration_minutes)}`
                          : ""}
                      </p>
                    </div>
                    <ConfirmButton label="Remover sessão" onConfirm={() => deleteSession(session.id)} />
                  </div>

                  {session.exercises.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-400">
                      {session.exercises.map((exercise) => (
                        <li key={exercise.id}>
                          {exercise.name}
                          {exercise.sets.length > 0 ? ` — ${formatSets(exercise.sets)}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
