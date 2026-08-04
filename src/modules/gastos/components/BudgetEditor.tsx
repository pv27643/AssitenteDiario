import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { EXPENSE_CATEGORIES } from "../types";
import type { Budget, ExpenseCategory } from "../types";

interface BudgetEditorProps {
  budgets: Budget[];
  onSave: (category: ExpenseCategory, monthlyLimit: number | null) => Promise<void>;
}

type ValuesByCategory = Record<ExpenseCategory, string>;

function buildInitialValues(budgets: Budget[]): ValuesByCategory {
  const byCategory = new Map(budgets.map((budget) => [budget.category, String(budget.monthly_limit)]));
  return Object.fromEntries(
    EXPENSE_CATEGORIES.map(({ value }) => [value, byCategory.get(value) ?? ""]),
  ) as ValuesByCategory;
}

export default function BudgetEditor({ budgets, onSave }: BudgetEditorProps) {
  const [values, setValues] = useState<ValuesByCategory>(() => buildInitialValues(budgets));
  const [savingCategory, setSavingCategory] = useState<ExpenseCategory | null>(null);

  useEffect(() => {
    setValues(buildInitialValues(budgets));
  }, [budgets]);

  async function handleSave(category: ExpenseCategory) {
    const raw = values[category].trim();
    const parsed = raw === "" ? null : Number(raw.replace(",", "."));

    if (raw !== "" && (!Number.isFinite(parsed) || (parsed as number) < 0)) {
      return;
    }

    setSavingCategory(category);
    await onSave(category, parsed);
    setSavingCategory(null);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-white">Orçamento mensal por categoria</h2>
      <p className="text-xs text-zinc-500">
        Define um limite por categoria para receberes aviso ao aproximares-te (80%) ou ultrapassares (100%).
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {EXPENSE_CATEGORIES.map(({ value, label }) => (
          <div key={value} className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-sm text-zinc-300">{label}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Sem limite"
              value={values[value]}
              onChange={(event) => setValues((prev) => ({ ...prev, [value]: event.target.value }))}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <button
              type="button"
              onClick={() => handleSave(value)}
              disabled={savingCategory === value}
              aria-label={`Guardar limite de ${label}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              <Check className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
