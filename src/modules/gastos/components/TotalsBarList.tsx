import type { PeriodTotal } from "../utils";
import { formatCurrency } from "../utils";

interface TotalsBarListProps {
  entries: PeriodTotal[];
  emptyMessage: string;
}

/** Lista de barras genérica — serve para totais por mês (dentro de um ano) e por ano. */
export default function TotalsBarList({ entries, emptyMessage }: TotalsBarListProps) {
  const hasAny = entries.some((entry) => entry.total > 0);
  const maxTotal = Math.max(...entries.map((entry) => entry.total), 0);

  if (!hasAny) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <div key={entry.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium text-white">{entry.label}</span>
            <span className="text-zinc-400">{formatCurrency(entry.total)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-300"
              style={{ width: maxTotal > 0 ? `${(entry.total / maxTotal) * 100}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
