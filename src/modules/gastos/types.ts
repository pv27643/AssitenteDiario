export type ExpenseCategory = "alimentacao" | "gasolina" | "casa" | "lazer" | "outros";

export interface Expense {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  spent_at: string;
  recurring: boolean;
  created_at: string;
}

export interface NewExpenseInput {
  category: ExpenseCategory;
  amount: number;
  spent_at: string;
  description?: string;
  recurring?: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  monthly_limit: number;
  created_at: string;
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "alimentacao", label: "Alimentação" },
  { value: "gasolina", label: "Gasolina" },
  { value: "casa", label: "Casa" },
  { value: "lazer", label: "Lazer" },
  { value: "outros", label: "Outros" },
];
