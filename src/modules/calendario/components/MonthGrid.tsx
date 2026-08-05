import { WEEKDAY_LABELS, buildMonthGrid } from "../utils";
import type { CalendarItem } from "../types";

interface MonthGridProps {
  year: number;
  month: number;
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export default function MonthGrid({ year, month, itemsByDate, selectedDate, onSelectDate }: MonthGridProps) {
  const cells = buildMonthGrid(year, month);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 sm:p-3">
      <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-[10px] font-medium text-zinc-500">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dayItems = itemsByDate.get(cell.date) ?? [];
          const isSelected = cell.date === selectedDate;

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={`flex aspect-square min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors ${
                isSelected ? "bg-zinc-800" : "hover:bg-zinc-800/60"
              } ${cell.inCurrentMonth ? "text-zinc-200" : "text-zinc-600"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  cell.isToday ? "border border-red-500 text-red-500" : ""
                }`}
              >
                {cell.day}
              </span>
              {dayItems.length > 0 && (
                <span className="flex gap-0.5">
                  {dayItems.slice(0, 3).map((item) => (
                    <span key={item.id} className="h-1 w-1 rounded-full bg-zinc-400" />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
