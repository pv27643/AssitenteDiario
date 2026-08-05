import { useState, type FormEvent } from "react";
import { EVENT_RECURRENCE_UNIT_OPTIONS } from "../types";
import type { EventRecurrenceUnit, NewEventInput } from "../types";

interface EventFormProps {
  initialDate?: string;
  onSubmit: (input: NewEventInput) => Promise<{ error: string | null }>;
  onCancel?: () => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

export default function EventForm({ initialDate, onSubmit, onCancel }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(initialDate ?? "");
  const [eventTime, setEventTime] = useState("");
  const [category, setCategory] = useState("");
  const [recurrenceUnit, setRecurrenceUnit] = useState<EventRecurrenceUnit>(null);
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [notifyValue, setNotifyValue] = useState("");
  const [notifyUnit, setNotifyUnit] = useState<"dias" | "horas">("dias");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Dá um título ao evento.");
      return;
    }
    if (!eventDate) {
      setError("Escolhe uma data.");
      return;
    }

    const parsedInterval = recurrenceUnit ? Number(recurrenceInterval) : null;
    if (recurrenceUnit && (!Number.isInteger(parsedInterval) || (parsedInterval as number) < 1)) {
      setError("O intervalo de recorrência tem de ser um número inteiro, no mínimo 1.");
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      title: title.trim(),
      event_date: eventDate,
      event_time: eventTime || null,
      category: category.trim() || null,
      recurrence_unit: recurrenceUnit,
      recurrence_interval: parsedInterval,
    });
    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setTitle("");
    setEventTime("");
    setCategory("");
    setRecurrenceUnit(null);
    setRecurrenceInterval("1");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-white">Novo evento</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="eventTitle" className={labelClass}>
            Título
          </label>
          <input
            id="eventTitle"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="eventDate" className={labelClass}>
            Data
          </label>
          <input
            id="eventDate"
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="eventTime" className={labelClass}>
            Hora (opcional)
          </label>
          <input
            id="eventTime"
            type="time"
            value={eventTime}
            onChange={(event) => setEventTime(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>
            Categoria (opcional)
          </label>
          <input
            id="category"
            type="text"
            placeholder="Trabalho, Pessoal, Saúde..."
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="recurrenceUnit" className={labelClass}>
            Recorrência
          </label>
          <div className="flex items-center gap-2">
            {recurrenceUnit && (
              <>
                <span className="shrink-0 text-sm text-zinc-400">Cada</span>
                <input
                  type="number"
                  min="1"
                  value={recurrenceInterval}
                  onChange={(event) => setRecurrenceInterval(event.target.value)}
                  aria-label="Intervalo de recorrência"
                  className={`${inputClass} w-20`}
                />
              </>
            )}
            <select
              id="recurrenceUnit"
              value={recurrenceUnit ?? ""}
              onChange={(event) =>
                setRecurrenceUnit(event.target.value === "" ? null : (event.target.value as EventRecurrenceUnit))
              }
              className={inputClass}
            >
              <option value="">Nenhuma</option>
              {EVENT_RECURRENCE_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 self-start rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {submitting ? "A criar..." : "Criar evento"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-zinc-700 px-5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
