export interface ReminderType {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  daily_goal: number | null;
  interval_hours: number | null;
  color: string;
  active: boolean;
  created_at: string;
}

export interface NewReminderTypeInput {
  name: string;
  unit: string;
  daily_goal: number | null;
  interval_hours: number | null;
  color: string;
}

export type ReminderTypeUpdateInput = Partial<NewReminderTypeInput> & { active?: boolean };

export interface ReminderLog {
  id: string;
  reminder_type_id: string;
  user_id: string;
  logged_at: string;
  note: string | null;
}

// Guardada por tipo (secção 3), mas não é usada para decorar o widget —
// a paleta do site fica mono (zinc/vermelho), ver secção 9.
export const REMINDER_COLOR_OPTIONS = ["teal", "blue", "green", "purple", "orange", "pink", "yellow"] as const;
