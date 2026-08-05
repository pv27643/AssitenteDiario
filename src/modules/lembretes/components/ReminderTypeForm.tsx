import { useState, type FormEvent } from "react";
import { REMINDER_INTERVAL_UNIT_OPTIONS } from "../types";
import type { NewReminderTypeInput, ReminderIntervalUnit } from "../types";
import { amountUnitToInterval } from "../utils";

interface ReminderTypeFormProps {
  onSubmit: (input: NewReminderTypeInput) => Promise<{ error: string | null }>;
  onCancel?: () => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

export default function ReminderTypeForm({ onSubmit, onCancel }: ReminderTypeFormProps) {
  const [name, setName] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");
  const [intervalAmount, setIntervalAmount] = useState("");
  const [intervalUnit, setIntervalUnit] = useState<ReminderIntervalUnit>("horas");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Dá um nome ao lembrete.");
      return;
    }

    const intervalHours = amountUnitToInterval(intervalAmount, intervalUnit);
    if (intervalHours === null) {
      setError("Define de quanto em quanto tempo queres ser lembrado.");
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      name: name.trim(),
      unit: "vez",
      daily_goal: dailyGoal ? Number(dailyGoal) : null,
      interval_hours: intervalHours,
      color: "teal",
    });
    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setName("");
    setDailyGoal("");
    setIntervalAmount("");
    setIntervalUnit("horas");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-white">Criar novo tipo de lembrete</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nome
          </label>
          <input
            id="name"
            type="text"
            placeholder="Água, Vitamina D, Caminhada..."
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="dailyGoal" className={labelClass}>
            Meta diária (opcional)
          </label>
          <input
            id="dailyGoal"
            type="number"
            min="1"
            inputMode="numeric"
            value={dailyGoal}
            onChange={(event) => setDailyGoal(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="intervalAmount" className={labelClass}>
            Lembrar a cada
          </label>
          <div className="flex gap-2">
            <input
              id="intervalAmount"
              type="number"
              min="1"
              inputMode="numeric"
              value={intervalAmount}
              onChange={(event) => setIntervalAmount(event.target.value)}
              className={inputClass}
              required
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
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 self-start rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {submitting ? "A criar..." : "Criar tipo de lembrete"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-zinc-700 px-5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
