import { useState, type FormEvent } from "react";
import type { NewGoalInput } from "../types";

interface GoalFormProps {
  onSubmit: (input: NewGoalInput) => Promise<{ error: string | null }>;
  onCancel?: () => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

export default function GoalForm({ onSubmit, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("0");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Dá um título à meta.");
      return;
    }
    if (!targetValue || Number(targetValue) <= 0) {
      setError("Define um valor-alvo maior que zero.");
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      title: title.trim(),
      target_value: Number(targetValue),
      current_value: Number(currentValue) || 0,
      unit: unit.trim(),
      deadline: deadline || null,
    });
    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setTitle("");
    setTargetValue("");
    setCurrentValue("0");
    setUnit("");
    setDeadline("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-white">Criar nova meta</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="goalTitle" className={labelClass}>
            Título
          </label>
          <input
            id="goalTitle"
            type="text"
            placeholder="Correr 10km, Supino 80kg..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="goalTarget" className={labelClass}>
            Valor-alvo
          </label>
          <input
            id="goalTarget"
            type="number"
            min="0"
            value={targetValue}
            onChange={(event) => setTargetValue(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="goalCurrent" className={labelClass}>
            Valor atual
          </label>
          <input
            id="goalCurrent"
            type="number"
            min="0"
            value={currentValue}
            onChange={(event) => setCurrentValue(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="goalUnit" className={labelClass}>
            Unidade
          </label>
          <input
            id="goalUnit"
            type="text"
            placeholder="km, kg, sessões..."
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="goalDeadline" className={labelClass}>
            Prazo (opcional)
          </label>
          <input
            id="goalDeadline"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 self-start rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {submitting ? "A criar..." : "Criar meta"}
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
