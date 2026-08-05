import { CalendarDays, ListChecks, Repeat } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import type { CalendarItem } from "../types";
import { formatDate, formatEventRecurrence } from "../utils";

interface DaySummaryProps {
  date: string;
  items: CalendarItem[];
  onDeleteEvent: (id: string) => void;
}

export default function DaySummary({ date, items, onDeleteEvent }: DaySummaryProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <h2 className="mb-3 text-sm font-semibold text-white">{formatDate(date)}</h2>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Sem eventos nem tarefas com prazo neste dia.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-800">
          {items.map((item) => (
            <li key={`${item.source}-${item.id}`} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-start gap-2">
                {item.source === "task" ? (
                  <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                ) : (
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  <p className="flex flex-wrap items-center gap-x-1 text-xs text-zinc-500">
                    <span>
                      {item.source === "task" ? "Prazo de tarefa" : "Evento"}
                      {item.time ? ` · ${item.time.slice(0, 5)}` : ""}
                      {item.category ? ` · ${item.category}` : ""}
                    </span>
                    {item.source === "event" && item.event.recurrence_unit && item.event.recurrence_interval && (
                      <span className="flex items-center gap-1">
                        · <Repeat className="h-3 w-3" />
                        {formatEventRecurrence(item.event.recurrence_unit, item.event.recurrence_interval)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {item.source === "event" && (
                <ConfirmButton
                  label={item.event.recurrence_unit ? "Remover série de eventos" : "Remover evento"}
                  onConfirm={() => onDeleteEvent(item.event.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
