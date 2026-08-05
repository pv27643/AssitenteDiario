import { useMemo, useState } from "react";
import { Bell, BellOff, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";
import { useEvents } from "./hooks/useEvents";
import EventForm from "./components/EventForm";
import MonthGrid from "./components/MonthGrid";
import WeekAgenda from "./components/WeekAgenda";
import YearOverview from "./components/YearOverview";
import DaySummary from "./components/DaySummary";
import RecurringEventsList from "./components/RecurringEventsList";
import {
  addMonths,
  addWeeks,
  countItemsByMonth,
  filterItemsByRange,
  formatMonthLabel,
  formatWeekLabel,
  getMonthRange,
  getWeekRange,
  getYearRange,
  groupByDate,
  groupRecurringEvents,
  todayIsoDate,
} from "./utils";

type ViewMode = "semanal" | "mensal" | "anual";

const UPCOMING_ITEMS_LIMIT = 5;

const PERIOD_LIST_TITLES: Record<ViewMode, string> = {
  semanal: "Eventos da semana",
  mensal: "Eventos do mês",
  anual: "Eventos do ano",
};

const VIEWS: { value: ViewMode; label: string }[] = [
  { value: "semanal", label: "Semana" },
  { value: "mensal", label: "Mês" },
  { value: "anual", label: "Anual" },
];

function viewButtonClass(isActive: boolean): string {
  return `min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
  }`;
}

export default function CalendarioPage() {
  const { items, loading, error, createEvent, deleteEvent } = useEvents();
  const {
    supported: pushSupported,
    subscribed: pushSubscribed,
    error: pushError,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications();

  const [view, setView] = useState<ViewMode>("semanal");
  const today = todayIsoDate();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [weekReference, setWeekReference] = useState(today);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [upcomingListOpen, setUpcomingListOpen] = useState(false);
  const [periodListOpen, setPeriodListOpen] = useState(false);
  const [recurringListOpen, setRecurringListOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const itemsByDate = useMemo(() => groupByDate(items), [items]);
  const recurringGroups = useMemo(() => groupRecurringEvents(items), [items]);

  const upcomingByDate = useMemo(() => {
    const upcoming = items
      .filter((item) => item.date >= today)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .slice(0, UPCOMING_ITEMS_LIMIT);
    return groupByDate(upcoming);
  }, [items, today]);
  const upcomingDates = Array.from(upcomingByDate.keys());

  // Esta lista acompanha a vista escolhida: eventos da semana, do mês
  // ou do ano que estão a ser vistos. É diferente de "Próximos eventos"
  // (sempre a partir de hoje, independente da vista).
  const periodByDate = useMemo(() => {
    const range =
      view === "semanal"
        ? getWeekRange(weekReference)
        : view === "mensal"
          ? getMonthRange(year, month)
          : getYearRange(year);
    return groupByDate(filterItemsByRange(items, range));
  }, [items, view, weekReference, year, month]);
  const periodDates = Array.from(periodByDate.keys()).sort();

  function handleSelectDate(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  function handlePrev() {
    if (view === "mensal") {
      const next = addMonths(year, month, -1);
      setYear(next.year);
      setMonth(next.month);
    } else if (view === "semanal") {
      setWeekReference((prev) => addWeeks(prev, -1));
    } else {
      setYear((prev) => prev - 1);
    }
  }

  function handleNext() {
    if (view === "mensal") {
      const next = addMonths(year, month, 1);
      setYear(next.year);
      setMonth(next.month);
    } else if (view === "semanal") {
      setWeekReference((prev) => addWeeks(prev, 1));
    } else {
      setYear((prev) => prev + 1);
    }
  }

  function handleSelectMonthFromYear(selectedMonth: number) {
    setMonth(selectedMonth);
    setView("mensal");
  }

  async function handleDeleteEvent(id: string) {
    const { error: deleteError } = await deleteEvent(id);
    if (deleteError) setActionError(deleteError);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-white">Calendário</h1>

      {pushSupported && (
        <button
          type="button"
          onClick={() => (pushSubscribed ? unsubscribeFromPush() : subscribeToPush())}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          {pushSubscribed ? (
            <>
              <BellOff className="h-4 w-4" />
              Desativar notificações
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Ativar notificações
            </>
          )}
        </button>
      )}
      {pushError && <p className="text-sm text-red-500">{pushError}</p>}

      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {VIEWS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setView(option.value)}
            className={viewButtonClass(view === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowForm((prev) => !prev)}
        className="min-h-11 w-full rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
      >
        {showForm ? "Fechar" : "Novo evento"}
      </button>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <EventForm
            initialDate={selectedDate ?? today}
            onSubmit={async (input) => {
              const result = await createEvent(input);
              if (!result.error) setShowForm(false);
              return result;
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {(error || actionError) && <p className="text-sm text-red-500">{error ?? actionError}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Período anterior"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-white">
          {view === "mensal"
            ? formatMonthLabel(year, month)
            : view === "semanal"
              ? formatWeekLabel(weekReference)
              : year}
        </span>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Período seguinte"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">A carregar...</p>
      ) : view === "mensal" ? (
        <MonthGrid
          year={year}
          month={month}
          itemsByDate={itemsByDate}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      ) : view === "semanal" ? (
        <WeekAgenda
          referenceDate={weekReference}
          itemsByDate={itemsByDate}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      ) : (
        <YearOverview months={countItemsByMonth(items, year)} onSelectMonth={handleSelectMonthFromYear} />
      )}

      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setUpcomingListOpen((prev) => !prev)}
          className="flex min-h-11 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Próximos eventos
          {upcomingListOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {upcomingListOpen &&
          (upcomingDates.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem eventos nem prazos próximos.</p>
          ) : (
            upcomingDates.map((date) => (
              <DaySummary
                key={date}
                date={date}
                items={upcomingByDate.get(date) ?? []}
                onDeleteEvent={handleDeleteEvent}
              />
            ))
          ))}
      </section>

      {selectedDate === null ? (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setPeriodListOpen((prev) => !prev)}
            className="flex min-h-11 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            {PERIOD_LIST_TITLES[view]}
            {periodListOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {periodListOpen &&
            (periodDates.length === 0 ? (
              <p className="text-sm text-zinc-500">Sem eventos nem prazos neste período.</p>
            ) : (
              periodDates.map((date) => (
                <DaySummary
                  key={date}
                  date={date}
                  items={periodByDate.get(date) ?? []}
                  onDeleteEvent={handleDeleteEvent}
                />
              ))
            ))}
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="flex min-h-11 items-center gap-1 self-start text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            {PERIOD_LIST_TITLES[view]}
          </button>
          <DaySummary
            date={selectedDate}
            items={itemsByDate.get(selectedDate) ?? []}
            onDeleteEvent={handleDeleteEvent}
          />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setRecurringListOpen((prev) => !prev)}
          className="flex min-h-11 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Eventos recorrentes
          {recurringListOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {recurringListOpen && <RecurringEventsList groups={recurringGroups} onDeleteEvent={handleDeleteEvent} />}
      </section>
    </div>
  );
}
