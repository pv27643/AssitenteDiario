export interface Event {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  linked_task_id: string | null;
  category: string | null;
  created_at: string;
}

export interface NewEventInput {
  title: string;
  event_date: string;
  event_time?: string | null;
  category?: string | null;
}

export type EventUpdateInput = Partial<NewEventInput>;

/**
 * Forma mínima de uma tarefa com prazo, só para aparecer no calendário.
 * Lida diretamente da tabela tasks — não duplicamos nada em events.
 */
export interface TaskDeadline {
  id: string;
  title: string;
  due_date: string;
  status: "por_fazer" | "em_curso" | "feito";
  priority: "baixa" | "media" | "alta";
}

export type CalendarItem =
  | {
      source: "event";
      id: string;
      date: string;
      time: string | null;
      title: string;
      category: string | null;
      event: Event;
    }
  | {
      source: "task";
      id: string;
      date: string;
      time: null;
      title: string;
      category: null;
      task: TaskDeadline;
    };
