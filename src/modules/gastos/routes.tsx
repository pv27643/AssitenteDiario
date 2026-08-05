import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useExpenses } from "./hooks/useExpenses";
import { useExpensesReport } from "./hooks/useExpensesReport";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import CategoryBars from "./components/CategoryBars";
import MonthSelector from "./components/MonthSelector";
import YearSelector from "./components/YearSelector";
import TotalsBarList from "./components/TotalsBarList";
import BudgetEditor from "./components/BudgetEditor";
import {
  computeMonthlyTotals,
  computeYearlyTotals,
  exportExpensesToCsv,
  filterExpensesByYear,
  formatCurrency,
} from "./utils";

type RecurringFilter = "todas" | "pontuais" | "recorrentes";
type ReportPeriod = "mes" | "ano" | "todos";

const FILTERS: { value: RecurringFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pontuais", label: "Pontuais" },
  { value: "recorrentes", label: "Recorrentes" },
];

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "mes", label: "Mês" },
  { value: "ano", label: "Ano" },
  { value: "todos", label: "Todos os anos" },
];

function filterButtonClass(isActive: boolean): string {
  return `min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
  }`;
}

export default function GastosPage() {
  const now = new Date();
  const [period, setPeriod] = useState<ReportPeriod>("mes");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [recurringFilter, setRecurringFilter] = useState<RecurringFilter>("todas");
  const [actionError, setActionError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    expenses,
    budgets,
    categories,
    loading,
    error,
    addExpense,
    deleteExpense,
    setBudget,
    createCategory,
    deleteCategory,
  } = useExpenses(year, month);

  const { allExpenses, loading: reportLoading, error: reportError, refetch: refetchReport } = useExpensesReport();

  useEffect(() => {
    if (period !== "mes") refetchReport();
  }, [period, refetchReport]);

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses],
  );

  const filteredExpenses = useMemo(() => {
    if (recurringFilter === "pontuais") return expenses.filter((expense) => !expense.recurring);
    if (recurringFilter === "recorrentes") return expenses.filter((expense) => expense.recurring);
    return expenses;
  }, [expenses, recurringFilter]);

  const yearExpenses = useMemo(() => filterExpensesByYear(allExpenses, reportYear), [allExpenses, reportYear]);
  const yearTotal = useMemo(
    () => yearExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [yearExpenses],
  );
  const monthlyTotals = useMemo(() => computeMonthlyTotals(allExpenses, reportYear), [allExpenses, reportYear]);

  const allTimeTotal = useMemo(
    () => allExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [allExpenses],
  );
  const yearlyTotals = useMemo(() => computeYearlyTotals(allExpenses), [allExpenses]);

  function handleMonthChange(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await deleteExpense(id);
    if (deleteError) setActionError(deleteError);
  }

  async function handleSaveBudget(categoryId: string, monthlyLimit: number | null) {
    const { error: saveError } = await setBudget(categoryId, monthlyLimit);
    if (saveError) setActionError(saveError);
  }

  async function handleDeleteCategory(id: string) {
    const { error: deleteError } = await deleteCategory(id);
    if (deleteError) setActionError(deleteError);
  }

  function handleExportMonth() {
    exportExpensesToCsv(expenses, categories, `${year}-${String(month).padStart(2, "0")}`);
  }

  function handleExportYear() {
    exportExpensesToCsv(yearExpenses, categories, String(reportYear));
  }

  function handleExportAll() {
    exportExpensesToCsv(allExpenses, categories, "todos-os-anos");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Gastos</h1>
        {period === "mes" && (
          <p className="mt-1 text-sm text-zinc-400">
            Total do mês: <span className="font-semibold text-white">{formatCurrency(total)}</span>
          </p>
        )}
        {period === "ano" && (
          <p className="mt-1 text-sm text-zinc-400">
            Total do ano: <span className="font-semibold text-white">{formatCurrency(yearTotal)}</span>
          </p>
        )}
        {period === "todos" && (
          <p className="mt-1 text-sm text-zinc-400">
            Total acumulado: <span className="font-semibold text-white">{formatCurrency(allTimeTotal)}</span>
          </p>
        )}
      </div>

      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {PERIODS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPeriod(option.value)}
            className={filterButtonClass(period === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {period === "mes" && (
        <>
          <MonthSelector year={year} month={month} onChange={handleMonthChange} />

          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="min-h-11 w-full rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            {showForm ? "Fechar" : "Nova despesa"}
          </button>

          {showForm && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
              <ExpenseForm
                categories={categories}
                onSubmit={async (input) => {
                  const result = await addExpense(input);
                  if (!result.error) setShowForm(false);
                  return result;
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {(error || actionError) && <p className="text-sm text-red-500">{error ?? actionError}</p>}

          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Por categoria</h2>
            {loading ? (
              <p className="text-sm text-zinc-500">A carregar...</p>
            ) : (
              <CategoryBars expenses={expenses} budgets={budgets} categories={categories} />
            )}
          </section>

          <BudgetEditor
            categories={categories}
            budgets={budgets}
            onSaveBudget={handleSaveBudget}
            onCreateCategory={createCategory}
            onDeleteCategory={handleDeleteCategory}
          />

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
                onClick={handleExportMonth}
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
              <ExpenseList expenses={filteredExpenses} categories={categories} onDelete={handleDelete} />
            )}
          </section>
        </>
      )}

      {period === "ano" && (
        <>
          <YearSelector year={reportYear} onChange={setReportYear} />

          {reportError && <p className="text-sm text-red-500">{reportError}</p>}

          {reportLoading ? (
            <p className="text-sm text-zinc-500">A carregar...</p>
          ) : (
            <>
              <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
                <h2 className="mb-4 text-sm font-semibold text-white">Por mês</h2>
                <TotalsBarList entries={monthlyTotals} emptyMessage={`Sem despesas registadas em ${reportYear}.`} />
              </section>

              <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
                <h2 className="mb-4 text-sm font-semibold text-white">Por categoria</h2>
                <CategoryBars expenses={yearExpenses} budgets={[]} categories={categories} />
              </section>

              <button
                type="button"
                onClick={handleExportYear}
                disabled={yearExpenses.length === 0}
                className="flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Exportar CSV do ano
              </button>
            </>
          )}
        </>
      )}

      {period === "todos" && (
        <>
          {reportError && <p className="text-sm text-red-500">{reportError}</p>}

          {reportLoading ? (
            <p className="text-sm text-zinc-500">A carregar...</p>
          ) : (
            <>
              <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
                <h2 className="mb-4 text-sm font-semibold text-white">Por ano</h2>
                <TotalsBarList entries={yearlyTotals} emptyMessage="Ainda não tens despesas registadas." />
              </section>

              <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
                <h2 className="mb-4 text-sm font-semibold text-white">Por categoria (total acumulado)</h2>
                <CategoryBars expenses={allExpenses} budgets={[]} categories={categories} />
              </section>

              <button
                type="button"
                onClick={handleExportAll}
                disabled={allExpenses.length === 0}
                className="flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Exportar CSV de tudo
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
