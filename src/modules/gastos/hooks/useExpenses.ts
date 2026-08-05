import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { Budget, Category, Expense, NewExpenseInput } from "../types";
import { monthRange } from "../utils";

interface MutationResult {
  error: string | null;
}

interface CreateCategoryResult {
  id: string | null;
  error: string | null;
}

interface UseExpensesResult {
  expenses: Expense[];
  budgets: Budget[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  addExpense: (input: NewExpenseInput) => Promise<MutationResult>;
  deleteExpense: (id: string) => Promise<MutationResult>;
  setBudget: (categoryId: string, monthlyLimit: number | null) => Promise<MutationResult>;
  createCategory: (name: string) => Promise<CreateCategoryResult>;
  deleteCategory: (id: string) => Promise<MutationResult>;
}

/** Despesas do mês (year/month) + orçamentos e categorias (sem âmbito de mês), sempre filtrados por RLS. */
export function useExpenses(year: number, month: number): UseExpensesResult {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setBudgets([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { start, end } = monthRange(year, month);

    const [expensesResult, budgetsResult, categoriesResult] = await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .gte("spent_at", start)
        .lt("spent_at", end)
        .order("spent_at", { ascending: false }),
      supabase.from("budgets").select("*"),
      supabase.from("expense_categories").select("*").order("name", { ascending: true }),
    ]);

    if (expensesResult.error) {
      setError("Não foi possível carregar as despesas.");
    } else {
      setExpenses((expensesResult.data ?? []) as Expense[]);
    }

    if (!budgetsResult.error) {
      setBudgets((budgetsResult.data ?? []) as Budget[]);
    }

    if (!categoriesResult.error) {
      setCategories((categoriesResult.data ?? []) as Category[]);
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
      category_id: input.category_id,
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

  async function setBudget(categoryId: string, monthlyLimit: number | null): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    if (monthlyLimit === null || monthlyLimit <= 0) {
      const { error: deleteError } = await supabase.from("budgets").delete().eq("category_id", categoryId);
      if (deleteError) return { error: "Não foi possível remover o orçamento." };
      await load();
      return { error: null };
    }

    const { error: upsertError } = await supabase
      .from("budgets")
      .upsert(
        { user_id: user.id, category_id: categoryId, monthly_limit: monthlyLimit },
        { onConflict: "user_id,category_id" },
      );

    if (upsertError) {
      return { error: "Não foi possível guardar o orçamento." };
    }

    await load();
    return { error: null };
  }

  async function createCategory(name: string): Promise<CreateCategoryResult> {
    if (!user) return { id: null, error: "Sessão inválida." };

    const trimmed = name.trim();
    if (!trimmed) return { id: null, error: null };

    const existing = categories.find((category) => category.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return { id: existing.id, error: null };

    const { data, error: insertError } = await supabase
      .from("expense_categories")
      .insert({ user_id: user.id, name: trimmed })
      .select("id")
      .single();

    if (insertError || !data) {
      return { id: null, error: "Não foi possível criar a categoria." };
    }

    await load();
    return { id: data.id, error: null };
  }

  async function deleteCategory(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("expense_categories").delete().eq("id", id);
    if (deleteError) {
      return { error: "Não foi possível apagar a categoria." };
    }
    await load();
    return { error: null };
  }

  return {
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
  };
}
