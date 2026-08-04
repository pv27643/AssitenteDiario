import { EXPENSE_CATEGORIES } from "./types";
import type { Expense, ExpenseCategory } from "./types";

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
  category: ExpenseCategory;
  label: string;
  total: number;
  percentage: number;
}

/** Totais por categoria, só as que têm despesas, ordenadas da maior para a menor. */
export function computeCategoryTotals(expenses: Expense[]): CategoryTotal[] {
  const totalsByCategory = new Map<ExpenseCategory, number>();
  let grandTotal = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    totalsByCategory.set(expense.category, (totalsByCategory.get(expense.category) ?? 0) + amount);
    grandTotal += amount;
  }

  return EXPENSE_CATEGORIES.map(({ value, label }) => {
    const total = totalsByCategory.get(value) ?? 0;
    return {
      category: value,
      label,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    };
  })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);
}

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportExpensesToCsv(expenses: Expense[], year: number, month: number): void {
  const categoryLabel = new Map(EXPENSE_CATEGORIES.map((c) => [c.value, c.label]));
  const header = ["Data", "Categoria", "Valor (EUR)", "Descrição", "Recorrente"];

  const rows = expenses.map((expense) =>
    [
      expense.spent_at,
      categoryLabel.get(expense.category) ?? expense.category,
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
  link.download = `gastos-${year}-${pad(month)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
