export type TaskStatus = "por_fazer" | "em_curso" | "feito";
export type TaskRecurrence = "diaria" | "semanal" | "mensal" | null;

export interface Task {
  id: string;
  user_id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  recurrence: TaskRecurrence;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface TaskWithRelations extends Task {
  tags: Tag[];
  subtasks: Subtask[];
}

export interface NewTaskInput {
  title: string;
  status?: TaskStatus;
  due_date?: string | null;
  recurrence?: TaskRecurrence;
  tagIds?: string[];
}

export type TaskUpdateInput = Partial<{
  title: string;
  status: TaskStatus;
  due_date: string | null;
  recurrence: TaskRecurrence;
}>;

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "por_fazer", label: "Por fazer" },
  { value: "em_curso", label: "Em curso" },
  { value: "feito", label: "Feito" },
];

export const TASK_RECURRENCE_OPTIONS: { value: NonNullable<TaskRecurrence>; label: string }[] = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
];
