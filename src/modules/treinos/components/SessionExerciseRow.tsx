import { useState } from "react";
import { Plus } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import Timer from "./Timer";
import type { SessionExerciseWithSets, SessionSet, SessionSetInput } from "../types";

interface SessionExerciseRowProps {
  exercise: SessionExerciseWithSets;
  isResting: boolean;
  onToggleRest: () => void;
  onAddSet: (input: SessionSetInput) => void;
  onUpdateSet: (id: string, input: SessionSetInput) => void;
  onDeleteSet: (id: string) => void;
  onDeleteExercise: () => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-center text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

function numberOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

interface SetFieldsProps {
  set: SessionSet;
  onUpdate: (input: SessionSetInput) => void;
  onDelete: () => void;
}

function SetFields({ set, onUpdate, onDelete }: SetFieldsProps) {
  const [reps, setReps] = useState(set.reps !== null ? String(set.reps) : "");
  const [weight, setWeight] = useState(set.weight !== null ? String(set.weight) : "");

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-zinc-500">Série {set.set_number}</span>
      <input
        type="number"
        min="0"
        inputMode="numeric"
        placeholder="Reps"
        value={reps}
        onChange={(event) => setReps(event.target.value)}
        onBlur={() => onUpdate({ reps: numberOrNull(reps) })}
        className={inputClass}
      />
      <input
        type="number"
        min="0"
        step="0.5"
        inputMode="decimal"
        placeholder="Kg"
        value={weight}
        onChange={(event) => setWeight(event.target.value)}
        onBlur={() => onUpdate({ weight: numberOrNull(weight) })}
        className={inputClass}
      />
      <ConfirmButton label={`Remover série ${set.set_number}`} onConfirm={onDelete} />
    </div>
  );
}

/** Uma linha da sessão ativa: nome do exercício + as séries realmente feitas (reps e carga podem variar de série para série). */
export default function SessionExerciseRow({
  exercise,
  isResting,
  onToggleRest,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onDeleteExercise,
}: SessionExerciseRowProps) {
  function handleAddSet() {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    onAddSet({ reps: null, weight: lastSet?.weight ?? null });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-white">{exercise.name}</span>
        <ConfirmButton label={`Remover ${exercise.name}`} onConfirm={onDeleteExercise} />
      </div>

      <div className="flex flex-col gap-2">
        {exercise.sets.map((set) => (
          <SetFields
            key={set.id}
            set={set}
            onUpdate={(input) => onUpdateSet(set.id, input)}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddSet}
        className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        <Plus className="h-4 w-4" />
        Adicionar série
      </button>

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
