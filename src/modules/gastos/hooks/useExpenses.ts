import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { Budget, Expense, ExpenseCategory, NewExpenseInput } from "../types";
import { monthRange } from "../utils";

interface MutationResult {
  error: string | null;
}

interface UseExpensesResult {
  expenses: Expense[];
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  addExpense: (input: NewExpenseInput) => Promise<MutationResult>;
  deleteExpense: (id: string) => Promise<MutationResult>;
  setBudget: (category: ExpenseCategory, monthlyLimit: number | null) => Promise<MutationResult>;
}

/** Despesas + orçamentos do mês (year/month), sempre filtrados pelo utilizador autenticado via RLS. */
export function useExpenses(year: number, month: number): UseExpensesResult {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { start, end } = monthRange(year, month);

    const [expensesResult, budgetsResult] = await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .gte("spent_at", start)
        .lt("spent_at", end)
        .order("spent_at", { ascending: false }),
      supabase.from("budgets").select("*"),
    ]);

    if (expensesResult.error) {
      setError("Não foi possível carregar as despesas.");
    } else {
      setExpenses((expensesResult.data ?? []) as Expense[]);
    }

    if (!budgetsResult.error) {
      setBudgets((budgetsResult.data ?? []) as Budget[]);
    }

    setLoading(false);
  }, [user, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  async function addExpense(input: NewExpenseInput): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    const { error: insertError } = await supabase.from("expenses").insert({
      user_id: user.id,
      category: input.category,
      amount: input.amount,
      description: input.description || null,
      spent_at: input.spent_at,
      recurring: input.recurring ?? false,
    });

    if (insertError) {
      return { error: "Não foi possível adicionar a despesa." };
    }

    await load();
    return { error: null };
  }

  async function deleteExpense(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("expenses").delete().eq("id", id);
    if (deleteError) {
      return { error: "Não foi possível remover a despesa." };
    }

    await load();
    return { error: null };
  }

  async function setBudget(category: ExpenseCategory, monthlyLimit: number | null): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    if (monthlyLimit === null || monthlyLimit <= 0) {
      const { error: deleteError } = await supabase.from("budgets").delete().eq("category", category);
      if (deleteError) return { error: "Não foi possível remover o orçamento." };
      await load();
      return { error: null };
    }

    const { error: upsertError } = await supabase
      .from("budgets")
      .upsert({ user_id: user.id, category, monthly_limit: monthlyLimit }, { onConflict: "user_id,category" });

    if (upsertError) {
      return { error: "Não foi possível guardar o orçamento." };
    }

    await load();
    return { error: null };
  }

  return { expenses, budgets, loading, error, addExpense, deleteExpense, setBudget };
}
