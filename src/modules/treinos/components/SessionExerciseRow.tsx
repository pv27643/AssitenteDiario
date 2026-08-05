import { useState } from "react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import Timer from "./Timer";
import type { SessionExercise, SessionExerciseUpdateInput } from "../types";

interface SessionExerciseRowProps {
  exercise: SessionExercise;
  isResting: boolean;
  onToggleRest: () => void;
  onUpdate: (input: SessionExerciseUpdateInput) => void;
  onDelete: () => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-center text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-xs text-zinc-400";

function numberOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

/** Uma linha da sessão ativa: nome do exercício + o que foi realmente feito (séries, reps, carga). */
export default function SessionExerciseRow({ exercise, isResting, onToggleRest, onUpdate, onDelete }: SessionExerciseRowProps) {
  const [sets, setSets] = useState(exercise.sets !== null ? String(exercise.sets) : "");
  const [reps, setReps] = useState(exercise.reps !== null ? String(exercise.reps) : "");
  const [weight, setWeight] = useState(exercise.weight !== null ? String(exercise.weight) : "");

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-white">{exercise.name}</span>
        <ConfirmButton label={`Remover ${exercise.name}`} onConfirm={onDelete} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelClass}>Séries</label>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={sets}
            onChange={(event) => setSets(event.target.value)}
            onBlur={() => onUpdate({ sets: numberOrNull(sets) })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Reps</label>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            onBlur={() => onUpdate({ reps: numberOrNull(reps) })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Carga (kg)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            onBlur={() => onUpdate({ weight: numberOrNull(weight) })}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleRest}
        className="min-h-11 self-start rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        {isResting ? "Fechar descanso" : "Descansar"}
      </button>

      {isResting && <Timer mode="countdown" initialSeconds={exercise.rest_seconds} onComplete={onToggleRest} />}
    </div>
  );
}
