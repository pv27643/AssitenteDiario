import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

interface ConfirmButtonProps {
  onConfirm: () => void;
  label: string;
}

/**
 * Botão de eliminar que abre um popup de confirmação ("Remover X?"),
 * em vez de apagar assim que se toca — evita eliminar por engano.
 */
export default function ConfirmButton({ onConfirm, label }: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function handleConfirm() {
    onConfirm();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label={label}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <p className="text-base font-medium text-white">{label}?</p>
              <p className="mt-1 text-sm text-zinc-500">Esta ação não pode ser desfeita.</p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setOpen(false)}
                  className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
