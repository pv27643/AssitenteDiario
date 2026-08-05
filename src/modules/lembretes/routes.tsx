import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";
import { useReminderTypes } from "./hooks/useReminderTypes";
import ReminderTypeForm from "./components/ReminderTypeForm";
import ReminderTypeRow from "./components/ReminderTypeRow";

export default function LembretesPage() {
  const { reminderTypes, loading, error, createReminderType, updateReminderType, deleteReminderType } =
    useReminderTypes();
  const {
    supported: pushSupported,
    subscribed: pushSubscribed,
    error: pushError,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications();
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const { error: deleteError } = await deleteReminderType(id);
    if (deleteError) setActionError(deleteError);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-white">Lembretes</h1>

      {pushSupported && (
        <button
          type="button"
          onClick={() => (pushSubscribed ? unsubscribeFromPush() : subscribeToPush())}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          {pushSubscribed ? (
            <>
              <BellOff className="h-4 w-4" />
              Desativar notificações
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Ativar notificações
            </>
          )}
        </button>
      )}
      {pushError && <p className="text-sm text-red-500">{pushError}</p>}

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
