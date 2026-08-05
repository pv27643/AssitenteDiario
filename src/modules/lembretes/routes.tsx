import { useState } from "react";
import { useReminderTypes } from "./hooks/useReminderTypes";
import ReminderTypeForm from "./components/ReminderTypeForm";
import ReminderTypeRow from "./components/ReminderTypeRow";

export default function LembretesPage() {
  const { reminderTypes, loading, error, createReminderType, updateReminderType, deleteReminderType } =
    useReminderTypes();
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const { error: deleteError } = await deleteReminderType(id);
    if (deleteError) setActionError(deleteError);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-white">Lembretes</h1>

      <button
        type="button"
        onClick={() => setShowForm((prev) => !prev)}
        className="min-h-11 w-full rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
      >
        {showForm ? "Fechar" : "Novo tipo de lembrete"}
      </button>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <ReminderTypeForm
            onSubmit={async (input) => {
              const result = await createReminderType(input);
              if (!result.error) setShowForm(false);
              return result;
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {(error || actionError) && <p className="text-sm text-red-500">{error ?? actionError}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white">Os teus tipos de lembrete</h2>

        {loading ? (
          <p className="text-sm text-zinc-500">A carregar...</p>
        ) : reminderTypes.length === 0 ? (
          <p className="text-sm text-zinc-500">Ainda não criaste nenhum tipo de lembrete.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reminderTypes.map((type) => (
              <ReminderTypeRow key={type.id} type={type} onUpdate={updateReminderType} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
