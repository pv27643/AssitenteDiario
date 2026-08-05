import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import type { PlanExercise, PlanExerciseUpdateInput } from "../types";

interface PlanExerciseRowProps {
  exercise: PlanExercise;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (input: PlanExerciseUpdateInput) => void;
  onDelete: () => void;
  onMove: (direction: "cima" | "baixo") => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-center text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-xs font-medium text-zinc-400";

export default function PlanExerciseRow({ exercise, isFirst, isLast, onUpdate, onDelete, onMove }: PlanExerciseRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [sets, setSets] = useState(String(exercise.sets));
  const [reps, setReps] = useState(String(exercise.reps));
  const [restSeconds, setRestSeconds] = useState(String(exercise.rest_seconds));

  function handleSave() {
    if (!name.trim()) return;
    onUpdate({
      name: name.trim(),
      sets: Number(sets) || exercise.sets,
      reps: Number(reps) || exercise.reps,
      rest_seconds: Number(restSeconds) || exercise.rest_seconds,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div>
          <label className={labelClass}>Nome</label>
          <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelClass}>Séries</label>
            <input
              type="number"
              min="1"
              value={sets}
              onChange={(event) => setSets(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Reps</label>
            <input
              type="number"
              min="1"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Descanso (s)</label>
            <input
              type="number"
              min="0"
              value={restSeconds}
              onChange={(event) => setRestSeconds(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <div className="min-w-0">
        <p className="font-medium text-white">{exercise.name}</p>
        <p className="text-xs text-zinc-500">
          {exercise.sets}×{exercise.reps} · descanso {exercise.rest_seconds}s
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onMove("cima")}
          disabled={isFirst}
          aria-label={`Mover ${exercise.name} para cima`}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-30"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove("baixo")}
          disabled={isLast}
          aria-label={`Mover ${exercise.name} para baixo`}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-30"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Editar ${exercise.name}`}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <ConfirmButton label={`Remover ${exercise.name}`} onConfirm={onDelete} />
      </div>
    </div>
  );
}
