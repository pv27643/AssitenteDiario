import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useExpenses } from "./hooks/useExpenses";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import CategoryBars from "./components/CategoryBars";
import MonthSelector from "./components/MonthSelector";
import BudgetEditor from "./components/BudgetEditor";
import type { ExpenseCategory } from "./types";
import { exportExpensesToCsv, formatCurrency } from "./utils";

type RecurringFilter = "todas" | "pontuais" | "recorrentes";

const FILTERS: { value: RecurringFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pontuais", label: "Pontuais" },
  { value: "recorrentes", label: "Recorrentes" },
];

function filterButtonClass(isActive: boolean): string {
  return `min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
  }`;
}

export default function GastosPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [recurringFilter, setRecurringFilter] = useState<RecurringFilter>("todas");
  const [actionError, setActionError] = useState<string | null>(null);

  const { expenses, budgets, loading, error, addExpense, deleteExpense, setBudget } = useExpenses(year, month);

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses],
  );

  const filteredExpenses = useMemo(() => {
    if (recurringFilter === "pontuais") return expenses.filter((expense) => !expense.recurring);
    if (recurringFilter === "recorrentes") return expenses.filter((expense) => expense.recurring);
    return expenses;
  }, [expenses, recurringFilter]);

  function handleMonthChange(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await deleteExpense(id);
    if (deleteError) setActionError(deleteError);
  }

  async function handleSaveBudget(category: ExpenseCategory, monthlyLimit: number | null) {
    const { error: saveError } = await setBudget(category, monthlyLimit);
    if (saveError) setActionError(saveError);
  }

  function handleExport() {
    exportExpensesToCsv(expenses, year, month);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Gastos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Total do mês: <span className="font-semibold text-white">{formatCurrency(total)}</span>
          </p>
        </div>
        <MonthSelector year={year} month={month} onChange={handleMonthChange} />
      </div>

      <ExpenseForm onSubmit={addExpense} />

      {(error || actionError) && <p className="text-sm text-red-500">{error ?? actionError}</p>}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-white">Por categoria</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">A carregar...</p>
        ) : (
          <CategoryBars expenses={expenses} budgets={budgets} />
        )}
      </section>

      <BudgetEditor budgets={budgets} onSave={handleSaveBudget} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setRecurringFilter(filter.value)}
                className={filterButtonClass(recurringFilter === filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={expenses.length === 0}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">A carregar despesas...</p>
        ) : (
          <ExpenseList expenses={filteredExpenses} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
