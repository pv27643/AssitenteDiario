import type { Goal, SessionWithExercises } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/** "MM:SS" — usado pelo temporizador (descanso e cronómetro). */
export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** "45 min" ou "1h 15min" — duração de uma sessão terminada. */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

export function formatSessionDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

/** Segunda-feira (00:00) da semana que contém a data. */
function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const weekday = (result.getDay() + 6) % 7; // 0 = segunda
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - weekday);
  return result;
}

export interface SessionGroup {
  label: string;
  sessions: SessionWithExercises[];
}

/** Sessões (mais recentes primeiro) agrupadas por semana ou por mês. */
export function groupSessionsByPeriod(sessions: SessionWithExercises[], period: "semana" | "mes"): SessionGroup[] {
  const sorted = sessions.slice().sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
  const groups = new Map<string, { label: string; sessions: SessionWithExercises[] }>();

  for (const session of sorted) {
    const date = new Date(session.started_at);
    let key: string;
    let label: string;

    if (period === "semana") {
      const monday = startOfWeek(date);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      key = toIsoDate(monday);
      const startLabel = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" }).format(monday);
      const endLabel = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", year: "numeric" }).format(
        sunday,
      );
      label = `${startLabel} – ${endLabel}`;
    } else {
      key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
      const monthLabel = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(date);
      label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    }

    const group = groups.get(key);
    if (group) group.sessions.push(session);
    else groups.set(key, { label, sessions: [session] });
  }

  return Array.from(groups.values());
}

export function goalProgress(goal: Goal): number {
  if (goal.target_value <= 0) return 0;
  return Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100));
}

const GOAL_DEADLINE_WARNING_DAYS = 3;

/** Perto do prazo (e ainda não concluída) — único sítio onde a meta usa vermelho de destaque. */
export function isGoalNearDeadline(goal: Goal): boolean {
  if (goal.status !== "ativa" || !goal.deadline) return false;
  const today = todayIsoDate();
  if (goal.deadline < today) return true;
  const diffDays = (new Date(`${goal.deadline}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) /
    86_400_000;
  return diffDays <= GOAL_DEADLINE_WARNING_DAYS;
}
