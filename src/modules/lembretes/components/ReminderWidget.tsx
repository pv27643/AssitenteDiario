import { useState } from "react";
import { Flame, Minus, Plus } from "lucide-react";
import { useReminderLogs } from "../hooks/useReminderLogs";
import type { ReminderType, ReminderTypeUpdateInput } from "../types";
import { computeDailyProgress, formatInterval } from "../utils";

interface ReminderWidgetProps {
  type: ReminderType;
  onUpdateType: (id: string, input: ReminderTypeUpdateInput) => Promise<{ error: string | null }>;
}

/**
 * Widget genérico: desenha-se a partir da configuração do tipo (nome,
 * unidade, meta, intervalo) — nenhuma lógica específica de um tipo
 * concreto (água, medicação, etc.) vive aqui.
 */
export default function ReminderWidget({ type, onUpdateType }: ReminderWidgetProps) {
  const { logs, addLog } = useReminderLogs(type.id);
  const [logging, setLogging] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  const { todayCount, streakDays } = computeDailyProgress(logs, type.daily_goal);
  const goal = type.daily_goal && type.daily_goal > 0 ? type.daily_goal : null;
  const progressPercent = goal ? Math.min((todayCount / goal) * 100, 100) : todayCount > 0 ? 100 : 0;
  const goalReached = goal !== null && todayCount >= goal;

  async function handleLog() {
    setLogging(true);
    await addLog();
    setLogging(false);
  }

  async function adjustInterval(delta: number) {
    const current = type.interval_hours ?? 0;
    const next = Math.max(1, current + delta);
    setAdjusting(true);
    await onUpdateType(type.id, { interval_hours: next });
    setAdjusting(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-white">{type.name}</span>
        {streakDays > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
            <Flame className="h-3.5 w-3.5" />
            {streakDays} {streakDays === 1 ? "dia" : "dias"}
          </span>
        )}
      </div>

      <div>
        <p className="mb-1 text-sm text-zinc-300">
          {todayCount}
          {goal ? ` / ${goal}` : ""} {type.unit}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${goalReached ? "bg-white" : "bg-zinc-400"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {type.interval_hours !== null && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Lembrar a cada {formatInterval(type.interval_hours)}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustInterval(-1)}
              disabled={adjusting || type.interval_hours <= 1}
              aria-label="Diminuir intervalo"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => adjustInterval(1)}
              disabled={adjusting}
              aria-label="Aumentar intervalo"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleLog}
        disabled={logging}
        className="min-h-11 rounded-lg bg-red-600 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
      >
        {logging ? "A registar..." : `+1 ${type.unit}`}
      </button>
    </div>
  );
}
