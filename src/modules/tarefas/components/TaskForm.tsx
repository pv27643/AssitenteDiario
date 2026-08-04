import { useState, type FormEvent } from "react";
import { TASK_PRIORITIES, TASK_RECURRENCE_OPTIONS, TASK_STATUSES } from "../types";
import type { NewTaskInput, Tag, TaskPriority, TaskRecurrence, TaskStatus, TaskWithRelations } from "../types";
import TagMultiSelect from "./TagMultiSelect";

interface TaskFormProps {
  tags: Tag[];
  onCreateTag: (name: string) => Promise<{ id: string | null; error: string | null }>;
  initialTask?: TaskWithRelations;
  onSubmit: (input: NewTaskInput) => Promise<{ error: string | null }>;
  onCancel?: () => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

export default function TaskForm({ tags, onCreateTag, initialTask, onSubmit, onCancel }: TaskFormProps) {
  const isEditing = initialTask !== undefined;

  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority ?? "media");
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status ?? "por_fazer");
  const [dueDate, setDueDate] = useState(initialTask?.due_date ?? "");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(initialTask?.recurrence ?? null);
  const [tagIds, setTagIds] = useState<string[]>(initialTask?.tags.map((tag) => tag.id) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Dá um título à tarefa.");
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      title: title.trim(),
      priority,
      status,
      due_date: dueDate || null,
      recurrence,
      tagIds,
    });
    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    if (!isEditing) {
      setTitle("");
      setPriority("media");
      setStatus("por_fazer");
      setDueDate("");
      setRecurrence(null);
      setTagIds([]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="priority" className={labelClass}>
            Prioridade
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className={inputClass}
          >
            {TASK_PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Estado
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className={inputClass}
          >
            {TASK_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className={labelClass}>
            Prazo (opcional)
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate ?? ""}
            onChange={(event) => setDueDate(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="recurrence" className={labelClass}>
            Recorrência
          </label>
          <select
            id="recurrence"
            value={recurrence ?? ""}
            onChange={(event) => setRecurrence(event.target.value === "" ? null : (event.target.value as TaskRecurrence))}
            className={inputClass}
          >
            <option value="">Nenhuma</option>
            {TASK_RECURRENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Etiquetas</label>
        <TagMultiSelect tags={tags} selectedIds={tagIds} onChange={setTagIds} onCreateTag={onCreateTag} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 self-start rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {submitting ? "A guardar..." : isEditing ? "Guardar alterações" : "Criar tarefa"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-zinc-700 px-5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
