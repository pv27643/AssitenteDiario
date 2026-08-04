import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEvents } from "./hooks/useEvents";
import EventForm from "./components/EventForm";
import MonthGrid from "./components/MonthGrid";
import WeekAgenda from "./components/WeekAgenda";
import DaySummary from "./components/DaySummary";
import { addMonths, addWeeks, formatMonthLabel, formatWeekLabel, groupByDate, todayIsoDate } from "./utils";

type ViewMode = "mensal" | "semanal";

function viewButtonClass(isActive: boolean): string {
  return `min-h-11 rounded-lg px-4 text-sm font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
  }`;
}

export default function CalendarioPage() {
  const { items, loading, error, createEvent, deleteEvent } = useEvents();

  const [view, setView] = useState<ViewMode>("mensal");
  const today = todayIsoDate();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [weekReference, setWeekReference] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const itemsByDate = useMemo(() => groupByDate(items), [items]);

  function handlePrev() {
    if (view === "mensal") {
      const next = addMonths(year, month, -1);
      setYear(next.year);
      setMonth(next.month);
    } else {
      setWeekReference((prev) => addWeeks(prev, -1));
    }
  }

  function handleNext() {
    if (view === "mensal") {
      const next = addMonths(year, month, 1);
      setYear(next.year);
      setMonth(next.month);
    } else {
      setWeekReference((prev) => addWeeks(prev, 1));
    }
  }

  async function handleDeleteEvent(id: string) {
    const { error: deleteError } = await deleteEvent(id);
    if (deleteError) setActionError(deleteError);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Calendário</h1>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            <button type="button" onClick={() => setView("mensal")} className={viewButtonClass(view === "mensal")}>
              Mês
            </button>
            <button type="button" onClick={() => setView("semanal")} className={viewButtonClass(view === "semanal")}>
              Semana
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            {showForm ? "Fechar" : "Novo evento"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <EventForm
            initialDate={selectedDate}
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
          {view === "mensal" ? formatMonthLabel(year, month) : formatWeekLabel(weekReference)}
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
          onSelectDate={setSelectedDate}
        />
      ) : (
        <WeekAgenda
          referenceDate={weekReference}
          itemsByDate={itemsByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      <DaySummary date={selectedDate} items={itemsByDate.get(selectedDate) ?? []} onDeleteEvent={handleDeleteEvent} />
    </div>
  );
}
