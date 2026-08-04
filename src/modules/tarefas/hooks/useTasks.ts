import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { NewTaskInput, Subtask, Tag, Task, TaskUpdateInput, TaskWithRelations } from "../types";
import { computeNextDueDate } from "../utils";

interface MutationResult {
  error: string | null;
}

interface CreateTagResult {
  id: string | null;
  error: string | null;
}

interface UseTasksResult {
  tasks: TaskWithRelations[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  createTask: (input: NewTaskInput) => Promise<MutationResult>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<MutationResult>;
  /** updateTask + associação de etiquetas num só passo — usado pelo formulário de edição. */
  updateTaskWithTags: (id: string, input: NewTaskInput) => Promise<MutationResult>;
  deleteTask: (id: string) => Promise<MutationResult>;
  setTaskTags: (taskId: string, tagIds: string[]) => Promise<MutationResult>;
  createTag: (name: string) => Promise<CreateTagResult>;
  addSubtask: (taskId: string, title: string) => Promise<MutationResult>;
  toggleSubtask: (subtaskId: string, done: boolean) => Promise<MutationResult>;
  deleteSubtask: (subtaskId: string) => Promise<MutationResult>;
}

interface RawTaskRow extends Task {
  task_tags: { tags: Tag | null }[] | null;
  subtasks: Subtask[] | null;
}

function toTaskWithRelations(row: RawTaskRow): TaskWithRelations {
  const { task_tags, subtasks, ...task } = row;
  return {
    ...task,
    tags: (task_tags ?? []).map((entry) => entry.tags).filter((tag): tag is Tag => tag !== null),
    subtasks: subtasks ?? [],
  };
}

/** Tarefas + etiquetas + subtarefas do utilizador autenticado (filtrado por RLS). */
export function useTasks(): UseTasksResult {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setTags([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [tasksResult, tagsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("*, task_tags(tags(id, user_id, name, created_at)), subtasks(id, task_id, title, done, created_at)")
        .order("created_at", { ascending: false }),
      supabase.from("tags").select("*").order("name", { ascending: true }),
    ]);

    if (tasksResult.error) {
      setError("Não foi possível carregar as tarefas.");
    } else {
      setTasks(((tasksResult.data ?? []) as unknown as RawTaskRow[]).map(toTaskWithRelations));
    }

    if (!tagsResult.error) {
      setTags((tagsResult.data ?? []) as Tag[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function createTask(input: NewTaskInput): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: input.title,
        priority: input.priority,
        status: input.status ?? "por_fazer",
        due_date: input.due_date ?? null,
        recurrence: input.recurrence ?? null,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      return { error: "Não foi possível criar a tarefa." };
    }

    if (input.tagIds && input.tagIds.length > 0) {
      const { error: tagsError } = await supabase
        .from("task_tags")
        .insert(input.tagIds.map((tagId) => ({ task_id: data.id, tag_id: tagId })));
      if (tagsError) {
        await load();
        return { error: "Tarefa criada, mas não foi possível associar as etiquetas." };
      }
    }

    await load();
    return { error: null };
  }

  async function updateTask(id: string, input: TaskUpdateInput): Promise<MutationResult> {
    const original = tasks.find((task) => task.id === id) ?? null;

    const { error: updateError } = await supabase.from("tasks").update(input).eq("id", id);
    if (updateError) {
      return { error: "Não foi possível atualizar a tarefa." };
    }

    const becameDone = input.status === "feito" && original !== null && original.status !== "feito";
    if (becameDone && original && original.recurrence) {
      const nextDueDate = computeNextDueDate(original.due_date, original.recurrence);
      await supabase.from("tasks").insert({
        user_id: original.user_id,
        title: original.title,
        priority: original.priority,
        status: "por_fazer",
        due_date: nextDueDate,
        recurrence: original.recurrence,
      });
    }

    await load();
    return { error: null };
  }

  async function updateTaskWithTags(id: string, input: NewTaskInput): Promise<MutationResult> {
    const { tagIds, ...taskFields } = input;

    const result = await updateTask(id, taskFields);
    if (result.error) return result;

    if (tagIds) return setTaskTags(id, tagIds);
    return { error: null };
  }

  async function deleteTask(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
    if (deleteError) {
      return { error: "Não foi possível remover a tarefa." };
    }
    await load();
    return { error: null };
  }

  async function setTaskTags(taskId: string, tagIds: string[]): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("task_tags").delete().eq("task_id", taskId);
    if (deleteError) {
      return { error: "Não foi possível atualizar as etiquetas." };
    }

    if (tagIds.length > 0) {
      const { error: insertError } = await supabase
        .from("task_tags")
        .insert(tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId })));
      if (insertError) {
        return { error: "Não foi possível atualizar as etiquetas." };
      }
    }

    await load();
    return { error: null };
  }

  async function createTag(name: string): Promise<CreateTagResult> {
    if (!user) return { id: null, error: "Sessão inválida." };

    const trimmed = name.trim();
    if (!trimmed) return { id: null, error: null };

    const existing = tags.find((tag) => tag.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return { id: existing.id, error: null };

    const { data, error: insertError } = await supabase
      .from("tags")
      .insert({ user_id: user.id, name: trimmed })
      .select("id")
      .single();

    if (insertError || !data) {
      return { id: null, error: "Não foi possível criar a etiqueta." };
    }

    await load();
    return { id: data.id, error: null };
  }

  async function addSubtask(taskId: string, title: string): Promise<MutationResult> {
    const trimmed = title.trim();
    if (!trimmed) return { error: null };

    const { error: insertError } = await supabase.from("subtasks").insert({ task_id: taskId, title: trimmed });
    if (insertError) {
      return { error: "Não foi possível adicionar a subtarefa." };
    }
    await load();
    return { error: null };
  }

  async function toggleSubtask(subtaskId: string, done: boolean): Promise<MutationResult> {
    const { error: updateError } = await supabase.from("subtasks").update({ done }).eq("id", subtaskId);
    if (updateError) {
      return { error: "Não foi possível atualizar a subtarefa." };
    }
    await load();
    return { error: null };
  }

  async function deleteSubtask(subtaskId: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("subtasks").delete().eq("id", subtaskId);
    if (deleteError) {
      return { error: "Não foi possível remover a subtarefa." };
    }
    await load();
    return { error: null };
  }

  return {
    tasks,
    tags,
    loading,
    error,
    createTask,
    updateTask,
    updateTaskWithTags,
    deleteTask,
    setTaskTags,
    createTag,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  };
}
