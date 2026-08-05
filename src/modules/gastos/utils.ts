import type { Category, Expense } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Intervalo [start, end) para filtrar spent_at de um mês (ano/mês locais, sem UTC). */
export function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${pad(month)}-01`;
  const next = new Date(year, month, 1); // month é 1-indexado — dá o 1º dia do mês seguinte
  const end = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
  return { start, end };
}

export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(amount);
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export interface CategoryTotal {
  categoryId: string | null;
  label: string;
  total: number;
  percentage: number;
}

const UNCATEGORIZED_LABEL = "Sem categoria";

/** Totais por categoria (incluindo despesas sem categoria), ordenados da maior para a menor. */
export function computeCategoryTotals(expenses: Expense[], categories: Category[]): CategoryTotal[] {
  const categoryLabel = new Map(categories.map((c) => [c.id, c.name]));
  const totalsByCategory = new Map<string | null, number>();
  let grandTotal = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    totalsByCategory.set(expense.category_id, (totalsByCategory.get(expense.category_id) ?? 0) + amount);
    grandTotal += amount;
  }

  return Array.from(totalsByCategory.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      label: categoryId ? (categoryLabel.get(categoryId) ?? "Categoria removida") : UNCATEGORIZED_LABEL,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export interface PeriodTotal {
  label: string;
  total: number;
}

/** Totais por mês (Jan-Dez) de um ano específico. */
export function computeMonthlyTotals(expenses: Expense[], year: number): PeriodTotal[] {
  const totalsByMonth = new Map<number, number>();

  for (const expense of expenses) {
    const [expenseYear, expenseMonth] = expense.spent_at.split("-").map(Number);
    if (expenseYear !== year) continue;
    totalsByMonth.set(expenseMonth, (totalsByMonth.get(expenseMonth) ?? 0) + Number(expense.amount));
  }

  return MONTH_LABELS.map((label, index) => ({
    label,
    total: totalsByMonth.get(index + 1) ?? 0,
  }));
}

/** Totais por ano, dos anos com pelo menos uma despesa, do mais antigo para o mais recente. */
export function computeYearlyTotals(expenses: Expense[]): PeriodTotal[] {
  const totalsByYear = new Map<number, number>();

  for (const expense of expenses) {
    const year = Number(expense.spent_at.slice(0, 4));
    totalsByYear.set(year, (totalsByYear.get(year) ?? 0) + Number(expense.amount));
  }

  return Array.from(totalsByYear.entries())
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, total]) => ({ label: String(year), total }));
}

export function filterExpensesByYear(expenses: Expense[], year: number): Expense[] {
  return expenses.filter((expense) => expense.spent_at.startsWith(String(year)));
}

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportExpensesToCsv(expenses: Expense[], categories: Category[], filenameSuffix: string): void {
  const categoryLabel = new Map(categories.map((c) => [c.id, c.name]));
  const header = ["Data", "Categoria", "Valor (EUR)", "Descrição", "Recorrente"];

  const rows = expenses.map((expense) =>
    [
      expense.spent_at,
      expense.category_id ? (categoryLabel.get(expense.category_id) ?? UNCATEGORIZED_LABEL) : UNCATEGORIZED_LABEL,
      Number(expense.amount).toFixed(2),
      expense.description ?? "",
      expense.recurring ? "Sim" : "Não",
    ]
      .map(escapeCsvField)
      .join(","),
  );

  const csvContent = [header.map(escapeCsvField).join(","), ...rows].join("\r\n");
  const BOM = "﻿"; // para o Excel reconhecer UTF-8 (acentos em "Alimentação", etc.)
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gastos-${filenameSuffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
