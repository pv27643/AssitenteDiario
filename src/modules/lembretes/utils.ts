import type { ReminderLog } from "./types";

function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface DailyProgress {
  todayCount: number;
  streakDays: number;
}

/**
 * Progresso de hoje + sequência de dias seguidos a bater a meta.
 * Sem meta definida, conta como "batido" qualquer dia com pelo menos 1 registo.
 * O streak não quebra só porque o dia de hoje ainda não acabou de bater a meta.
 */
export function computeDailyProgress(logs: ReminderLog[], dailyGoal: number | null): DailyProgress {
  const countsByDay = new Map<string, number>();
  for (const log of logs) {
    const key = dateKey(new Date(log.logged_at));
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const goal = dailyGoal && dailyGoal > 0 ? dailyGoal : 1;
  const today = new Date();
  const todayCount = countsByDay.get(dateKey(today)) ?? 0;

  let streakDays = 0;
  const cursor = new Date(today);
  if (todayCount < goal) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while ((countsByDay.get(dateKey(cursor)) ?? 0) >= goal) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { todayCount, streakDays };
}
