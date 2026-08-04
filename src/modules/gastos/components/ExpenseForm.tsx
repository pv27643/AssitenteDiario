import { useState, type FormEvent } from "react";
import { EXPENSE_CATEGORIES } from "../types";
import type { ExpenseCategory, NewExpenseInput } from "../types";
import { todayIsoDate } from "../utils";

interface ExpenseFormProps {
  onSubmit: (input: NewExpenseInput) => Promise<{ error: string | null }>;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

export default function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [category, setCategory] = useState<ExpenseCategory>("alimentacao");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState(todayIsoDate());
  const [description, setDescription] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Indica um valor válido, maior que zero.");
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      category,
      amount: parsedAmount,
      spent_at: spentAt,
      description: description.trim() || undefined,
      recurring,
    });
    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setAmount("");
    setDescription("");
    setRecurring(false);
    setSpentAt(todayIsoDate());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
    >
      <h2 className="text-sm font-semibold text-white">Adicionar despesa</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={labelClass}>
            Categoria
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
            className={inputClass}
          >
            {EXPENSE_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className={labelClass}>
            Valor (€)
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="spentAt" className={labelClass}>
            Data
          </label>
          <input
            id="spentAt"
            type="date"
            value={spentAt}
            onChange={(event) => setSpentAt(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Descrição (opcional)
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(event) => setRecurring(event.target.checked)}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-red-600 focus:ring-red-500"
        />
        Despesa recorrente (ex: renda, assinatura)
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-11 self-start rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
      >
        {submitting ? "A adicionar..." : "Adicionar despesa"}
      </button>
    </form>
  );
}
