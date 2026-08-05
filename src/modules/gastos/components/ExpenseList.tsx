import ConfirmButton from "@/shared/components/ConfirmButton";
import type { Category, Expense } from "../types";
import { formatCurrency, formatDate } from "../utils";

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, categories, onDelete }: ExpenseListProps) {
  const categoryLabels = new Map(categories.map((c) => [c.id, c.name]));

  if (expenses.length === 0) {
    return <p className="text-sm text-zinc-500">Sem despesas para mostrar.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      {expenses.map((expense) => (
        <li key={expense.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-white">
                {expense.category_id ? (categoryLabels.get(expense.category_id) ?? "Categoria removida") : "Sem categoria"}
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
          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            <span className="text-sm font-semibold text-white">{formatCurrency(expense.amount)}</span>
            <ConfirmButton label="Remover despesa" onConfirm={() => onDelete(expense.id)} />
          </div>
        </li>
      ))}
    </ul>
  );
}
