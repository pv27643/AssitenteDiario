import { EVENT_RECURRENCE_UNIT_OPTIONS } from "./types";
import type { CalendarItem, Event, EventRecurrenceUnit } from "./types";

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

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export interface MonthItemCount {
  month: number;
  label: string;
  count: number;
}

/** Nº de itens (eventos + prazos de tarefas) por mês, para a vista Anual. */
export function countItemsByMonth(items: CalendarItem[], year: number): MonthItemCount[] {
  const countsByMonth = new Map<number, number>();

  for (const item of items) {
    const [itemYear, itemMonth] = item.date.split("-").map(Number);
    if (itemYear !== year) continue;
    countsByMonth.set(itemMonth, (countsByMonth.get(itemMonth) ?? 0) + 1);
  }

  return MONTH_LABELS.map((label, index) => ({
    month: index + 1,
    label,
    count: countsByMonth.get(index + 1) ?? 0,
  }));
}

const RECURRING_EXPANSION_YEARS_AHEAD = 2;
const RECURRING_EXPANSION_MAX_OCCURRENCES = 500;

/**
 * Datas de ocorrência de um evento recorrente, a partir da 1ª data até
 * ~2 anos no futuro — nunca guardadas na BD, só calculadas ao desenhar
 * o calendário (o evento continua a ser uma única linha em events).
 * "interval" é o "de quantos em quantos" (ex: unit="dias", interval=5
 * → de 5 em 5 dias).
 */
export function expandEventOccurrences(
  startDate: string,
  unit: NonNullable<EventRecurrenceUnit>,
  interval: number,
): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date();
  end.setFullYear(end.getFullYear() + RECURRING_EXPANSION_YEARS_AHEAD);

  const step = Math.max(1, Math.floor(interval));
  let iterations = 0;
  while (current <= end && iterations < RECURRING_EXPANSION_MAX_OCCURRENCES) {
    dates.push(toIsoDate(current));
    if (unit === "dias") current.setDate(current.getDate() + step);
    else if (unit === "semanas") current.setDate(current.getDate() + step * 7);
    else if (unit === "meses") current.setMonth(current.getMonth() + step);
    else current.setFullYear(current.getFullYear() + step);
    iterations += 1;
  }

  return dates;
}

/** "Cada 5 dias", "Cada semana"... para mostrar junto de um evento recorrente. */
export function formatEventRecurrence(unit: NonNullable<EventRecurrenceUnit>, interval: number): string {
  const option = EVENT_RECURRENCE_UNIT_OPTIONS.find((entry) => entry.value === unit);
  const unitLabel = interval === 1 ? (option?.labelSingular ?? unit) : (option?.label ?? unit);
  return `Cada ${interval === 1 ? "" : `${interval} `}${unitLabel}`;
}

export interface DateRange {
  start: string;
  end: string;
}

/** Intervalo [start, end) da semana (segunda a domingo) que contém a data de referência. */
export function getWeekRange(referenceDate: string): DateRange {
  const days = buildWeekDays(referenceDate);
  const end = new Date(`${days[6].date}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return { start: days[0].date, end: toIsoDate(end) };
}

/** Intervalo [start, end) de um mês. */
export function getMonthRange(year: number, month: number): DateRange {
  const start = `${year}-${pad(month)}-01`;
  const next = new Date(year, month, 1);
  return { start, end: toIsoDate(next) };
}

/** Intervalo [start, end) de um ano. */
export function getYearRange(year: number): DateRange {
  return { start: `${year}-01-01`, end: `${year + 1}-01-01` };
}

export function filterItemsByRange(items: CalendarItem[], range: DateRange): CalendarItem[] {
  return items.filter((item) => item.date >= range.start && item.date < range.end);
}

export interface RecurringEventGroup {
  unit: NonNullable<EventRecurrenceUnit>;
  label: string;
  events: Event[];
}

const RECURRING_GROUP_ORDER: { unit: NonNullable<EventRecurrenceUnit>; label: string }[] = [
  { unit: "dias", label: "Eventos diários" },
  { unit: "semanas", label: "Eventos semanais" },
  { unit: "meses", label: "Eventos mensais" },
  { unit: "anos", label: "Eventos anuais" },
];

/** Eventos recorrentes (as séries, não as ocorrências), agrupados por dias/semanas/meses/anos. */
export function groupRecurringEvents(items: CalendarItem[]): RecurringEventGroup[] {
  const uniqueEvents = new Map<string, Event>();
  for (const item of items) {
    if (item.source === "event" && item.event.recurrence_unit) {
      uniqueEvents.set(item.event.id, item.event);
    }
  }

  return RECURRING_GROUP_ORDER.map(({ unit, label }) => ({
    unit,
    label,
    events: Array.from(uniqueEvents.values()).filter((event) => event.recurrence_unit === unit),
  })).filter((group) => group.events.length > 0);
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
