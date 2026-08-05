import { Repeat } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import type { RecurringEventGroup } from "../utils";
import { formatDate, formatEventRecurrence } from "../utils";

interface RecurringEventsListProps {
  groups: RecurringEventGroup[];
  onDeleteEvent: (id: string) => void;
}

export default function RecurringEventsList({ groups, onDeleteEvent }: RecurringEventsListProps) {
  if (groups.length === 0) {
    return <p className="text-sm text-zinc-500">Ainda não tens eventos recorrentes.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <section key={group.unit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <h2 className="mb-3 text-sm font-semibold text-white">{group.label}</h2>

          <ul className="flex flex-col divide-y divide-zinc-800">
            {group.events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-2">
                  <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{event.title}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {event.recurrence_unit &&
                        event.recurrence_interval &&
                        formatEventRecurrence(event.recurrence_unit, event.recurrence_interval)}
                      {" · desde "}
                      {formatDate(event.event_date)}
                      {event.category ? ` · ${event.category}` : ""}
                    </p>
                  </div>
                </div>
                <ConfirmButton label="Remover série de eventos" onConfirm={() => onDeleteEvent(event.id)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
