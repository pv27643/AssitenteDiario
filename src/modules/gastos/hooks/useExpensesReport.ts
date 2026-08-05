import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { Expense } from "../types";

interface UseExpensesReportResult {
  allExpenses: Expense[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Todas as despesas do utilizador, sem filtro de mês — para os relatórios anual e multi-ano. */
export function useExpensesReport(): UseExpensesReportResult {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setAllExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .order("spent_at", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar o relatório.");
    } else {
      setAllExpenses((data ?? []) as Expense[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { allExpenses, loading, error, refetch: load };
}
