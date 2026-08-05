export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface PlanExercise {
  id: string;
  plan_id: string;
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  position: number;
  created_at: string;
}

export interface PlanWithExercises extends WorkoutPlan {
  exercises: PlanExercise[];
}

export interface NewPlanExerciseInput {
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
}

export type PlanExerciseUpdateInput = Partial<NewPlanExerciseInput>;

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string | null;
  started_at: string;
  duration_minutes: number | null;
  created_at: string;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  name: string;
  position: number;
  rest_seconds: number;
  created_at: string;
}

/** Uma série realmente feita — reps e carga podem mudar de série para série. */
export interface SessionSet {
  id: string;
  session_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  created_at: string;
}

export interface SessionExerciseWithSets extends SessionExercise {
  sets: SessionSet[];
}

export interface SessionWithExercises extends WorkoutSession {
  plan_name: string | null;
  exercises: SessionExerciseWithSets[];
}

export type SessionExerciseUpdateInput = Partial<{
  name: string;
  rest_seconds: number;
}>;

export type SessionSetInput = Partial<{
  reps: number | null;
  weight: number | null;
}>;

export type GoalStatus = "ativa" | "concluida" | "cancelada";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  status: GoalStatus;
  created_at: string;
}

export interface NewGoalInput {
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
}

export type GoalUpdateInput = Partial<{
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  status: GoalStatus;
}>;

export const GOAL_STATUSES: { value: GoalStatus; label: string }[] = [
  { value: "ativa", label: "Ativa" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];
