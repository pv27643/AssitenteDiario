import { Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES } from "../types";
import type { Expense } from "../types";
import { formatCurrency, formatDate } from "../utils";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

const categoryLabels = new Map(EXPENSE_CATEGORIES.map((c) => [c.value, c.label]));

export default function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <p className="text-sm text-zinc-500">Sem despesas para mostrar.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      {expenses.map((expense) => (
        <li key={expense.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-white">
                {categoryLabels.get(expense.category) ?? expense.category}
              </span>
              {expense.recurring && (
                <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                  Recorrente
                </span>
              )}
            </div>
            <p className="truncate text-xs text-zinc-500">
              {formatDate(expense.spent_at)}
              {expense.description ? ` · ${expense.description}` : ""}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-white">{formatCurrency(expense.amount)}</span>
          <button
            type="button"
            onClick={() => onDelete(expense.id)}
            aria-label="Remover despesa"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
