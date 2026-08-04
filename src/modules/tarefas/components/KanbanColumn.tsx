import type { DragEvent } from "react";
import { TASK_STATUSES } from "../types";
import type { NewTaskInput, Tag, TaskStatus, TaskWithRelations } from "../types";
import TaskCard from "./TaskCard";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskWithRelations[];
  tags: Tag[];
  onUpdate: (id: string, input: NewTaskInput) => Promise<{ error: string | null }>;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onCreateTag: (name: string) => Promise<{ id: string | null; error: string | null }>;
  onAddSubtask: (taskId: string, title: string) => Promise<{ error: string | null }>;
  onToggleSubtask: (subtaskId: string, done: boolean) => Promise<{ error: string | null }>;
  onDeleteSubtask: (subtaskId: string) => Promise<{ error: string | null }>;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
}

const statusLabel = new Map(TASK_STATUSES.map((option) => [option.value, option.label]));

export default function KanbanColumn({
  status,
  tasks,
  tags,
  onUpdate,
  onDelete,
  onStatusChange,
  onCreateTag,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onMoveTask,
}: KanbanColumnProps) {
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    if (taskId) onMoveTask(taskId, status);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-white">{statusLabel.get(status)}</h3>
        <span className="text-xs text-zinc-500">{tasks.length}</span>
      </div>

      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="px-1 text-xs text-zinc-600">Sem tarefas.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              tags={tags}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onCreateTag={onCreateTag}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
            />
          ))
        )}
      </div>
    </div>
  );
}
