import type { CalendarItem } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatWeekLabel(referenceDate: string): string {
  const days = buildWeekDays(referenceDate);
  const start = new Date(`${days[0].date}T00:00:00`);
  const end = new Date(`${days[6].date}T00:00:00`);
  const startLabel = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" }).format(start);
  const endLabel = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", year: "numeric" }).format(end);
  return `${startLabel} – ${endLabel}`;
}

export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export interface MonthDayCell {
  date: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/** Grelha do mês (semanas de segunda a domingo), com dias do mês anterior/seguinte para completar as semanas. */
export function buildMonthGrid(year: number, month: number): MonthDayCell[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = segunda
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - firstWeekday);

  const today = todayIsoDate();
  const cells: MonthDayCell[] = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = toIsoDate(date);
    cells.push({
      date: iso,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month - 1,
      isToday: iso === today,
    });
  }

  return cells;
}

export interface WeekDayCell {
  date: string;
  label: string;
  day: number;
  isToday: boolean;
}

/** Dias (segunda a domingo) da semana que contém a data de referência. */
export function buildWeekDays(referenceDate: string): WeekDayCell[] {
  const ref = new Date(`${referenceDate}T00:00:00`);
  const weekday = (ref.getDay() + 6) % 7;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - weekday);

  const today = todayIsoDate();
  const days: WeekDayCell[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const iso = toIsoDate(date);
    days.push({
      date: iso,
      label: WEEKDAY_LABELS[i],
      day: date.getDate(),
      isToday: iso === today,
    });
  }

  return days;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function addWeeks(referenceDate: string, delta: number): string {
  const date = new Date(`${referenceDate}T00:00:00`);
  date.setDate(date.getDate() + delta * 7);
  return toIsoDate(date);
}

export function groupByDate(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  }
  return map;
}
