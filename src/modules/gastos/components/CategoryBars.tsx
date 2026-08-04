import type { Budget, Expense } from "../types";
import { computeCategoryTotals, formatCurrency } from "../utils";

interface CategoryBarsProps {
  expenses: Expense[];
  budgets: Budget[];
}

export default function CategoryBars({ expenses, budgets }: CategoryBarsProps) {
  const categoryTotals = computeCategoryTotals(expenses);
  const budgetByCategory = new Map(budgets.map((budget) => [budget.category, Number(budget.monthly_limit)]));

  if (categoryTotals.length === 0) {
    return <p className="text-sm text-zinc-500">Sem despesas registadas neste mês.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {categoryTotals.map((entry) => {
        const limit = budgetByCategory.get(entry.category) ?? null;
        const budgetRatio = limit ? entry.total / limit : null;
        const isOverBudget = budgetRatio !== null && budgetRatio >= 1;
        const isNearBudget = budgetRatio !== null && budgetRatio >= 0.8 && budgetRatio < 1;

        const barColor = isOverBudget ? "bg-red-600" : isNearBudget ? "bg-red-500/60" : "bg-zinc-300";

        return (
          <div key={entry.category}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
              <span className="font-medium text-white">{entry.label}</span>
              <span className={isOverBudget ? "text-red-500" : "text-zinc-400"}>
                {formatCurrency(entry.total)} · {entry.percentage.toFixed(0)}%
                {limit ? ` de ${formatCurrency(limit)}` : ""}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${Math.min(entry.percentage, 100)}%` }}
              />
            </div>
            {isOverBudget && <p className="mt-1 text-xs text-red-500">Orçamento ultrapassado.</p>}
            {isNearBudget && <p className="mt-1 text-xs text-red-400">Perto do limite do orçamento.</p>}
          </div>
        );
      })}
    </div>
  );
}
