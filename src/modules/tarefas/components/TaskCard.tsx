import { useState, type DragEvent } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Pencil, Repeat } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import { TASK_RECURRENCE_OPTIONS, TASK_STATUSES } from "../types";
import type { NewTaskInput, Tag, TaskStatus, TaskWithRelations } from "../types";
import { formatDate, isOverdue } from "../utils";
import TaskForm from "./TaskForm";
import SubtaskList from "./SubtaskList";

interface TaskCardProps {
  task: TaskWithRelations;
  tags: Tag[];
  onUpdate: (id: string, input: NewTaskInput) => Promise<{ error: string | null }>;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onCreateTag: (name: string) => Promise<{ id: string | null; error: string | null }>;
  onAddSubtask: (taskId: string, title: string) => Promise<{ error: string | null }>;
  onToggleSubtask: (subtaskId: string, done: boolean) => Promise<{ error: string | null }>;
  onDeleteSubtask: (subtaskId: string) => Promise<{ error: string | null }>;
}

const recurrenceLabel = new Map(TASK_RECURRENCE_OPTIONS.map((option) => [option.value, option.label]));

export default function TaskCard({
  task,
  tags,
  onUpdate,
  onDelete,
  onStatusChange,
  onCreateTag,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const overdue = isOverdue(task);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.done).length;

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("text/plain", task.id);
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <TaskForm
          tags={tags}
          onCreateTag={onCreateTag}
          initialTask={task}
          onSubmit={async (input) => {
            const result = await onUpdate(task.id, input);
            if (!result.error) setEditing(false);
            return result;
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-white">{task.title}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar tarefa"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <ConfirmButton label="Remover tarefa" onConfirm={() => onDelete(task.id)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        {task.due_date && (
          <span className={`flex items-center gap-1 ${overdue ? "text-red-500" : "text-zinc-400"}`}>
            {overdue && <AlertCircle className="h-3.5 w-3.5" />}
            {formatDate(task.due_date)}
            {overdue ? " · atrasada" : ""}
          </span>
        )}
        {task.recurrence && (
          <span className="flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-0.5">
            <Repeat className="h-3 w-3" />
            {recurrenceLabel.get(task.recurrence)}
          </span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag.id} className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <select
        value={task.status}
        onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
        className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        {TASK_STATUSES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex min-h-11 items-center justify-between text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <span>Subtarefas {task.subtasks.length > 0 ? `(${doneSubtasks}/${task.subtasks.length})` : ""}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <SubtaskList
          taskId={task.id}
          subtasks={task.subtasks}
          onAdd={onAddSubtask}
          onToggle={onToggleSubtask}
          onDelete={onDeleteSubtask}
        />
      )}
    </div>
  );
}
