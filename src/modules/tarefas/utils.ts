import type { Task, TaskPriority, TaskRecurrence } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function isOverdue(task: Pick<Task, "due_date" | "status">): boolean {
  return task.due_date !== null && task.due_date < todayIsoDate() && task.status !== "feito";
}

/** Próxima due_date de uma tarefa recorrente, a contar da due_date atual (ou de hoje, se não tinha). */
export function computeNextDueDate(currentDueDate: string | null, recurrence: NonNullable<TaskRecurrence>): string {
  const base = currentDueDate ? new Date(`${currentDueDate}T00:00:00`) : new Date();
  const next = new Date(base);

  if (recurrence === "diaria") next.setDate(next.getDate() + 1);
  else if (recurrence === "semanal") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);

  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

const PRIORITY_RANK: Record<TaskPriority, number> = { alta: 0, media: 1, baixa: 2 };

/** Prioridade mais alta primeiro; dentro da mesma prioridade, prazo mais próximo primeiro. */
export function compareTasks(a: Task, b: Task): number {
  const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (rankDiff !== 0) return rankDiff;

  if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
  if (a.due_date) return -1;
  if (b.due_date) return 1;
  return 0;
}
