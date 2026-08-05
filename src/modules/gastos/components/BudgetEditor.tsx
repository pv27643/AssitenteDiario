import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import type { Budget, Category } from "../types";

interface BudgetEditorProps {
  categories: Category[];
  budgets: Budget[];
  onSaveBudget: (categoryId: string, monthlyLimit: number | null) => Promise<void>;
  onCreateCategory: (name: string) => Promise<{ id: string | null; error: string | null }>;
  onDeleteCategory: (id: string) => Promise<void>;
}

type ValuesByCategory = Record<string, string>;

function buildInitialValues(categories: Category[], budgets: Budget[]): ValuesByCategory {
  const byCategory = new Map(budgets.map((budget) => [budget.category_id, String(budget.monthly_limit)]));
  return Object.fromEntries(categories.map(({ id }) => [id, byCategory.get(id) ?? ""]));
}

export default function BudgetEditor({
  categories,
  budgets,
  onSaveBudget,
  onCreateCategory,
  onDeleteCategory,
}: BudgetEditorProps) {
  const [values, setValues] = useState<ValuesByCategory>(() => buildInitialValues(categories, budgets));
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(buildInitialValues(categories, budgets));
  }, [categories, budgets]);

  async function handleSave(categoryId: string) {
    const raw = (values[categoryId] ?? "").trim();
    const parsed = raw === "" ? null : Number(raw.replace(",", "."));

    if (raw !== "" && (!Number.isFinite(parsed) || (parsed as number) < 0)) {
      return;
    }

    setSavingCategoryId(categoryId);
    await onSaveBudget(categoryId, parsed);
    setSavingCategoryId(null);
  }

  async function handleCreate() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setError(null);
    setCreating(true);
    const { error: createError } = await onCreateCategory(trimmed);
    setCreating(false);

    if (createError) {
      setError(createError);
      return;
    }
    setNewCategoryName("");
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-white">Categorias e orçamento mensal</h2>
      <p className="text-xs text-zinc-500">
        Define um limite por categoria para receberes aviso ao aproximares-te (80%) ou ultrapassares (100%). O
        caixote do lixo apaga a categoria — as despesas já registadas ficam, só passam a "sem categoria".
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {categories.length === 0 && <p className="text-sm text-zinc-500">Ainda não tens categorias.</p>}

        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-sm text-zinc-300">{category.name}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Sem limite"
              value={values[category.id] ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [category.id]: event.target.value }))}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <button
              type="button"
              onClick={() => handleSave(category.id)}
              disabled={savingCategoryId === category.id}
              aria-label={`Guardar limite de ${category.name}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              <Check className="h-5 w-5" />
            </button>
            <ConfirmButton
              label={`Apagar categoria ${category.name}`}
              onConfirm={() => onDeleteCategory(category.id)}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="mt-2 flex gap-2 border-t border-zinc-800 pt-3">
        <input
          type="text"
          placeholder="Nova categoria"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleCreate();
            }
          }}
          className="min-h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !newCategoryName.trim()}
          aria-label="Criar categoria"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
