import { useState } from "react";
import { Plus } from "lucide-react";
import type { Tag } from "../types";

interface TagMultiSelectProps {
  tags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateTag: (name: string) => Promise<{ id: string | null; error: string | null }>;
}

export default function TagMultiSelect({ tags, selectedIds, onChange, onCreateTag }: TagMultiSelectProps) {
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existingId) => existingId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  async function handleCreate() {
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    setCreating(true);
    const { id } = await onCreateTag(trimmed);
    setCreating(false);
    setNewTagName("");

    if (id && !selectedIds.includes(id)) {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={`min-h-11 rounded-full border px-3 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-red-500 bg-red-500/10 text-red-500"
                    : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <input
          type="text"
          placeholder="Nova etiqueta"
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleCreate();
            }
          }}
          className="min-h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !newTagName.trim()}
          aria-label="Criar etiqueta"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
