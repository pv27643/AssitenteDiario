import { useMemo, useState } from "react";
import { useTasks } from "./hooks/useTasks";
import TaskForm from "./components/TaskForm";
import KanbanColumn from "./components/KanbanColumn";
import { TASK_PRIORITIES, TASK_STATUSES } from "./types";
import type { NewTaskInput, TaskPriority, TaskStatus } from "./types";
import { compareTasks } from "./utils";

type PriorityFilter = "todas" | TaskPriority;

function filterButtonClass(isActive: boolean): string {
  return `min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
  }`;
}

function statusChipClass(isVisible: boolean): string {
  return `min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors ${
    isVisible
      ? "border-red-500 bg-red-500/10 text-red-500"
      : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
  }`;
}

export default function TarefasPage() {
  const {
    tasks,
    tags,
    loading,
    error,
    createTask,
    updateTask,
    updateTaskWithTags,
    deleteTask,
    createTag,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTasks();

  const [showForm, setShowForm] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("todas");
  const [visibleStatuses, setVisibleStatuses] = useState<Set<TaskStatus>>(
    () => new Set(TASK_STATUSES.map((option) => option.value)),
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => priorityFilter === "todas" || task.priority === priorityFilter)
      .slice()
      .sort(compareTasks);
  }, [tasks, priorityFilter]);

  const columns = TASK_STATUSES.filter((option) => visibleStatuses.has(option.value));
  const gridColsClass =
    columns.length === 1 ? "md:grid-cols-1" : columns.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  function toggleStatusVisible(status: TaskStatus) {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status) && next.size > 1) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await deleteTask(id);
    if (deleteError) setActionError(deleteError);
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    const { error: updateError } = await updateTask(id, { status });
    if (updateError) setActionError(updateError);
  }

  async function handleFullUpdate(id: string, input: NewTaskInput): Promise<{ error: string | null }> {
    const result = await updateTaskWithTags(id, input);
    if (result.error) setActionError(result.error);
    return result;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Tarefas</h1>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
        >
          {showForm ? "Fechar" : "Nova tarefa"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <TaskForm
            tags={tags}
            onCreateTag={createTag}
            onSubmit={async (input) => {
              const result = await createTask(input);
              if (!result.error) setShowForm(false);
              return result;
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {(error || actionError) && <p className="text-sm text-red-500">{error ?? actionError}</p>}

      <div className="flex flex-col gap-3">
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setPriorityFilter("todas")}
            className={filterButtonClass(priorityFilter === "todas")}
          >
            Todas
          </button>
          {TASK_PRIORITIES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPriorityFilter(option.value)}
              className={filterButtonClass(priorityFilter === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {TASK_STATUSES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleStatusVisible(option.value)}
              className={statusChipClass(visibleStatuses.has(option.value))}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">A carregar tarefas...</p>
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${gridColsClass}`}>
          {columns.map((column) => (
            <KanbanColumn
              key={column.value}
              status={column.value}
              tasks={filteredTasks.filter((task) => task.status === column.value)}
              tags={tags}
              onUpdate={handleFullUpdate}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onCreateTag={createTag}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onDeleteSubtask={deleteSubtask}
              onMoveTask={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
