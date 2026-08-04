import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Subtask } from "../types";

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onAdd: (taskId: string, title: string) => Promise<{ error: string | null }>;
  onToggle: (subtaskId: string, done: boolean) => Promise<{ error: string | null }>;
  onDelete: (subtaskId: string) => Promise<{ error: string | null }>;
}

export default function SubtaskList({ taskId, subtasks, onAdd, onToggle, onDelete }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setAdding(true);
    await onAdd(taskId, newTitle);
    setAdding(false);
    setNewTitle("");
  }

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2">
          <label className="flex min-h-11 flex-1 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={subtask.done}
              onChange={(event) => onToggle(subtask.id, event.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-red-600 focus:ring-red-500"
            />
            <span className={subtask.done ? "text-zinc-500 line-through" : "text-zinc-200"}>{subtask.title}</span>
          </label>
          <button
            type="button"
            onClick={() => onDelete(subtask.id)}
            aria-label={`Remover subtarefa ${subtask.title}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nova subtarefa"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          className="min-h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          aria-label="Adicionar subtarefa"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
