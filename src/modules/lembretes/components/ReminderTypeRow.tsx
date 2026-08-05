import { useState } from "react";
import { Eye, EyeOff, Pencil } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import { REMINDER_COLOR_OPTIONS, REMINDER_INTERVAL_UNIT_OPTIONS } from "../types";
import type { ReminderIntervalUnit, ReminderType, ReminderTypeUpdateInput } from "../types";
import { amountUnitToInterval, formatInterval, intervalToAmountUnit } from "../utils";

interface ReminderTypeRowProps {
  type: ReminderType;
  onUpdate: (id: string, input: ReminderTypeUpdateInput) => Promise<{ error: string | null }>;
  onDelete: (id: string) => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-xs font-medium text-zinc-400";

export default function ReminderTypeRow({ type, onUpdate, onDelete }: ReminderTypeRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(type.name);
  const [dailyGoal, setDailyGoal] = useState(type.daily_goal ? String(type.daily_goal) : "");
  const initialInterval = intervalToAmountUnit(type.interval_hours);
  const [intervalAmount, setIntervalAmount] = useState(initialInterval.amount);
  const [intervalUnit, setIntervalUnit] = useState<ReminderIntervalUnit>(initialInterval.unit);
  const [color, setColor] = useState(type.color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Dá um nome ao lembrete.");
      return;
    }

    const intervalHours = amountUnitToInterval(intervalAmount, intervalUnit);
    if (intervalHours === null) {
      setError("Define de quanto em quanto tempo queres ser lembrado.");
      return;
    }

    setError(null);
    setSaving(true);
    const { error: saveError } = await onUpdate(type.id, {
      name: name.trim(),
      daily_goal: dailyGoal ? Number(dailyGoal) : null,
      interval_hours: intervalHours,
      color,
    });
    setSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }
    setEditing(false);
  }

  async function handleToggleActive() {
    await onUpdate(type.id, { active: !type.active });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nome</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Meta diária</label>
            <input
              type="number"
              min="1"
              value={dailyGoal}
              onChange={(event) => setDailyGoal(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Lembrar a cada</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={intervalAmount}
                onChange={(event) => setIntervalAmount(event.target.value)}
                className={inputClass}
              />
              <select
                aria-label="Unidade do intervalo"
                value={intervalUnit}
                onChange={(event) => setIntervalUnit(event.target.value as ReminderIntervalUnit)}
                className={inputClass}
              >
                {REMINDER_INTERVAL_UNIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Cor</label>
            <select value={color} onChange={(event) => setColor(event.target.value)} className={inputClass}>
              {REMINDER_COLOR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Guardar"}
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
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 ${
        type.active ? "" : "opacity-50"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{type.name}</span>
          {!type.active && (
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
              Inativo
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {type.daily_goal ? `meta ${type.daily_goal}/dia` : ""}
          {type.interval_hours !== null
            ? `${type.daily_goal ? " · " : ""}a cada ${formatInterval(type.interval_hours)}`
            : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Editar ${type.name}`}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleToggleActive}
          aria-label={type.active ? `Desativar ${type.name}` : `Ativar ${type.name}`}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          {type.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <ConfirmButton label={`Eliminar ${type.name}`} onConfirm={() => onDelete(type.id)} />
      </div>
    </div>
  );
}
