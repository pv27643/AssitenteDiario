import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/context/AuthContext";
import type { CalendarItem, Event, EventUpdateInput, NewEventInput, TaskDeadline } from "../types";

interface MutationResult {
  error: string | null;
}

interface UseEventsResult {
  items: CalendarItem[];
  loading: boolean;
  error: string | null;
  createEvent: (input: NewEventInput) => Promise<MutationResult>;
  updateEvent: (id: string, input: EventUpdateInput) => Promise<MutationResult>;
  deleteEvent: (id: string) => Promise<MutationResult>;
}

/**
 * Eventos manuais (tabela events) fundidos com tarefas que têm due_date
 * (tabela tasks) — as tarefas não são copiadas para events, só lidas e
 * apresentadas como itens do calendário.
 */
export function useEvents(): UseEventsResult {
  const { user } = useAuth();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [eventsResult, tasksResult] = await Promise.all([
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      supabase.from("tasks").select("id, title, due_date, status, priority").not("due_date", "is", null),
    ]);

    if (eventsResult.error) {
      setError("Não foi possível carregar o calendário.");
      setLoading(false);
      return;
    }

    const eventItems: CalendarItem[] = ((eventsResult.data ?? []) as Event[]).map((event) => ({
      source: "event",
      id: event.id,
      date: event.event_date,
      time: event.event_time,
      title: event.title,
      category: event.category,
      event,
    }));

    const taskItems: CalendarItem[] = tasksResult.error
      ? []
      : ((tasksResult.data ?? []) as TaskDeadline[]).map((task) => ({
          source: "task",
          id: task.id,
          date: task.due_date,
          time: null,
          title: task.title,
          category: null,
          task,
        }));

    setItems([...eventItems, ...taskItems]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function createEvent(input: NewEventInput): Promise<MutationResult> {
    if (!user) return { error: "Sessão inválida." };

    const { error: insertError } = await supabase.from("events").insert({
      user_id: user.id,
      title: input.title,
      event_date: input.event_date,
      event_time: input.event_time || null,
      category: input.category || null,
    });

    if (insertError) {
      return { error: "Não foi possível criar o evento." };
    }

    await load();
    return { error: null };
  }

  async function updateEvent(id: string, input: EventUpdateInput): Promise<MutationResult> {
    const { error: updateError } = await supabase.from("events").update(input).eq("id", id);
    if (updateError) {
      return { error: "Não foi possível atualizar o evento." };
    }
    await load();
    return { error: null };
  }

  async function deleteEvent(id: string): Promise<MutationResult> {
    const { error: deleteError } = await supabase.from("events").delete().eq("id", id);
    if (deleteError) {
      return { error: "Não foi possível remover o evento." };
    }
    await load();
    return { error: null };
  }

  return { items, loading, error, createEvent, updateEvent, deleteEvent };
}
