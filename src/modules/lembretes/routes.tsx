import { useState } from "react";
import { useReminderTypes } from "./hooks/useReminderTypes";
import ReminderTypeForm from "./components/ReminderTypeForm";
import ReminderTypeRow from "./components/ReminderTypeRow";

export default function LembretesPage() {
  const { reminderTypes, loading, error, createReminderType, updateReminderType, deleteReminderType } =
    useReminderTypes();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const { error: deleteError } = await deleteReminderType(id);
    if (deleteError) setActionError(deleteError);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-white">Lembretes</h1>

      <ReminderTypeForm onSubmit={createReminderType} />

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
