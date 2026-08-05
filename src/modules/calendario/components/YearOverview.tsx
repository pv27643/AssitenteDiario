import type { MonthItemCount } from "../utils";

interface YearOverviewProps {
  months: MonthItemCount[];
  onSelectMonth: (month: number) => void;
}

/** Um mês por linha, com o nº de eventos/prazos desse mês — clicar leva à vista Mês. */
export default function YearOverview({ months, onSelectMonth }: YearOverviewProps) {
  const maxCount = Math.max(...months.map((entry) => entry.count), 0);

  return (
    <div className="flex flex-col gap-2">
      {months.map((entry) => (
        <button
          key={entry.month}
          type="button"
          onClick={() => onSelectMonth(entry.month)}
          className="flex min-h-11 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition-colors hover:bg-zinc-800/60"
        >
          <span className="w-24 shrink-0 text-sm font-medium text-white">{entry.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-300"
              style={{ width: maxCount > 0 ? `${(entry.count / maxCount) * 100}%` : "0%" }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs text-zinc-400">{entry.count}</span>
        </button>
      ))}
    </div>
  );
}
