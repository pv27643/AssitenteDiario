import { useState, type FormEvent } from "react";
import { REMINDER_COLOR_OPTIONS } from "../types";
import type { NewReminderTypeInput } from "../types";

interface ReminderTypeFormProps {
  onSubmit: (input: NewReminderTypeInput) => Promise<{ error: string | null }>;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

export default function ReminderTypeForm({ onSubmit }: ReminderTypeFormProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("vez");
  const [dailyGoal, setDailyGoal] = useState("");
  const [intervalHours, setIntervalHours] = useState("");
  const [color, setColor] = useState<string>(REMINDER_COLOR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Dá um nome ao lembrete.");
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      name: name.trim(),
      unit: unit.trim() || "vez",
      daily_goal: dailyGoal ? Number(dailyGoal) : null,
      interval_hours: intervalHours ? Number(intervalHours) : null,
      color,
    });
    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setName("");
    setUnit("vez");
    setDailyGoal("");
    setIntervalHours("");
    setColor(REMINDER_COLOR_OPTIONS[0]);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
    >
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
          <label htmlFor="unit" className={labelClass}>
            Unidade
          </label>
          <input
            id="unit"
            type="text"
            placeholder="copos, comprimidos, vezes..."
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className={inputClass}
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
          <label htmlFor="intervalHours" className={labelClass}>
            Lembrar a cada (horas, opcional)
          </label>
          <input
            id="intervalHours"
            type="number"
            min="1"
            inputMode="numeric"
            value={intervalHours}
            onChange={(event) => setIntervalHours(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="color" className={labelClass}>
            Cor (guardada para uso futuro)
          </label>
          <select id="color" value={color} onChange={(event) => setColor(event.target.value)} className={inputClass}>
            {REMINDER_COLOR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-11 self-start rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
      >
        {submitting ? "A criar..." : "Criar tipo de lembrete"}
      </button>
    </form>
  );
}
