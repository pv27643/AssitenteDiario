import { CalendarDays, ListChecks } from "lucide-react";
import { buildWeekDays } from "../utils";
import type { CalendarItem } from "../types";

interface WeekAgendaProps {
  referenceDate: string;
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function WeekAgenda({ referenceDate, itemsByDate, selectedDate, onSelectDate }: WeekAgendaProps) {
  const days = buildWeekDays(referenceDate);

  return (
    <div className="flex flex-col gap-2">
      {days.map((day) => {
        const dayItems = itemsByDate.get(day.date) ?? [];
        const isSelected = day.date === selectedDate;

        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDate(day.date)}
            className={`flex min-h-11 flex-col gap-1 rounded-xl border p-3 text-left transition-colors ${
              isSelected ? "border-zinc-600 bg-zinc-800" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/60"
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  day.isToday ? "border border-red-500 text-red-500" : "text-zinc-400"
                }`}
              >
                {day.day}
              </span>
              <span className="font-medium text-white">{day.label}</span>
            </div>

            {dayItems.length > 0 && (
              <div className="flex flex-col gap-1 pl-8">
                {dayItems.map((item) => (
                  <span key={item.id} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    {item.source === "task" ? (
                      <ListChecks className="h-3 w-3 shrink-0" />
                    ) : (
                      <CalendarDays className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
