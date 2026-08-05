import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import ConfirmButton from "@/shared/components/ConfirmButton";
import PlanExerciseRow from "./PlanExerciseRow";
import type { NewPlanExerciseInput, PlanExerciseUpdateInput, PlanWithExercises } from "../types";

interface PlanCardProps {
  plan: PlanWithExercises;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddExercise: (input: NewPlanExerciseInput) => void;
  onUpdateExercise: (id: string, input: PlanExerciseUpdateInput) => void;
  onDeleteExercise: (id: string) => void;
  onMoveExercise: (id: string, direction: "cima" | "baixo") => void;
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export default function PlanCard({
  plan,
  onRename,
  onDelete,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onMoveExercise,
}: PlanCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(plan.name);
  const [addingExercise, setAddingExercise] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSets, setNewSets] = useState("3");
  const [newReps, setNewReps] = useState("10");
  const [newRest, setNewRest] = useState("180");

  function handleSaveName() {
    if (!name.trim()) return;
    onRename(name.trim());
    setEditingName(false);
  }

  function handleAddExercise() {
    if (!newName.trim()) return;
    onAddExercise({
      name: newName.trim(),
      sets: Number(newSets) || 1,
      reps: Number(newReps) || 1,
      rest_seconds: Number(newRest) || 0,
    });
    setNewName("");
    setNewSets("3");
    setNewReps("10");
    setNewRest("180");
    setAddingExercise(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-2">
        {editingName ? (
          <div className="flex flex-1 gap-2">
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            <button
              type="button"
              onClick={handleSaveName}
              className="min-h-11 shrink-0 rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              Guardar
            </button>
          </div>
        ) : (
          <>
            <span className="font-medium text-white">{plan.name}</span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setEditingName(true)}
                aria-label={`Renomear ${plan.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <ConfirmButton label={`Eliminar plano ${plan.name}`} onConfirm={onDelete} />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {plan.exercises.length === 0 ? (
          <p className="text-sm text-zinc-500">Ainda sem exercícios.</p>
        ) : (
          plan.exercises.map((exercise, index) => (
            <PlanExerciseRow
              key={exercise.id}
              exercise={exercise}
              isFirst={index === 0}
              isLast={index === plan.exercises.length - 1}
              onUpdate={(input) => onUpdateExercise(exercise.id, input)}
              onDelete={() => onDeleteExercise(exercise.id)}
              onMove={(direction) => onMoveExercise(exercise.id, direction)}
            />
          ))
        )}
      </div>

      {addingExercise ? (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <input
            type="text"
            placeholder="Nome do exercício"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            className={inputClass}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              min="1"
              placeholder="Séries"
              value={newSets}
              onChange={(event) => setNewSets(event.target.value)}
              className={inputClass}
            />
            <input
              type="number"
              min="1"
              placeholder="Reps"
              value={newReps}
              onChange={(event) => setNewReps(event.target.value)}
              className={inputClass}
            />
            <input
              type="number"
              min="0"
              placeholder="Descanso (s)"
              value={newRest}
              onChange={(event) => setNewRest(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddExercise}
              className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setAddingExercise(false)}
              className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingExercise(true)}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Adicionar exercício
        </button>
      )}
    </div>
  );
}
