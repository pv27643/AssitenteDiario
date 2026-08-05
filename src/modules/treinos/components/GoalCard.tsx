import { useState } from "react";
import { Pencil } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import { GOAL_STATUSES } from "../types";
import type { Goal, GoalStatus, GoalUpdateInput } from "../types";
import { goalProgress, isGoalNearDeadline } from "../utils";

interface GoalCardProps {
  goal: Goal;
  onUpdate: (input: GoalUpdateInput) => void;
  onDelete: () => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-xs font-medium text-zinc-400";

export default function GoalCard({ goal, onUpdate, onDelete }: GoalCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [targetValue, setTargetValue] = useState(String(goal.target_value));
  const [unit, setUnit] = useState(goal.unit);
  const [deadline, setDeadline] = useState(goal.deadline ?? "");
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [quickValue, setQuickValue] = useState(String(goal.current_value));

  const percent = goalProgress(goal);
  const nearDeadline = isGoalNearDeadline(goal);
  const barColor = nearDeadline ? "bg-red-500" : percent >= 100 ? "bg-white" : "bg-zinc-300";

  function handleSaveEdit() {
    if (!title.trim()) return;
    onUpdate({
      title: title.trim(),
      target_value: Number(targetValue) || goal.target_value,
      unit: unit.trim(),
      deadline: deadline || null,
      status,
    });
    setEditing(false);
  }

  function handleQuickUpdate() {
    const parsed = Number(quickValue);
    if (Number.isNaN(parsed)) return;
    onUpdate({ current_value: parsed });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div>
          <label className={labelClass}>Título</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Valor-alvo</label>
            <input
              type="number"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Unidade</label>
            <input value={unit} onChange={(event) => setUnit(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Prazo (opcional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select value={status} onChange={(event) => setStatus(event.target.value as GoalStatus)} className={inputClass}>
              {GOAL_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveEdit}
            className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-medium text-white">{goal.title}</span>
          {goal.status !== "ativa" && (
            <span className="ml-2 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
              {GOAL_STATUSES.find((option) => option.value === goal.status)?.label}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Editar ${goal.title}`}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <ConfirmButton label={`Eliminar meta ${goal.title}`} onConfirm={onDelete} />
        </div>
      </div>

      <div>
        <p className={`mb-1 text-sm ${nearDeadline ? "text-red-500" : "text-zinc-400"}`}>
          {goal.current_value} / {goal.target_value} {goal.unit}
          {goal.deadline ? ` · prazo ${goal.deadline.split("-").reverse().join("/")}` : ""}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={quickValue}
          onChange={(event) => setQuickValue(event.target.value)}
          className={inputClass}
          aria-label="Atualizar valor atual"
        />
        <button
          type="button"
          onClick={handleQuickUpdate}
          className="min-h-11 shrink-0 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}
