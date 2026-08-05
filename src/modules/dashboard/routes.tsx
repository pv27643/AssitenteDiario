import { useMemo } from "react";

import { useTasks } from "@/modules/tarefas/hooks/useTasks";
import TaskCard from "@/modules/tarefas/components/TaskCard";
import { todayIsoDate } from "@/modules/tarefas/utils";

import { useExpenses } from "@/modules/gastos/hooks/useExpenses";
import CategoryBars from "@/modules/gastos/components/CategoryBars";
import { formatCurrency } from "@/modules/gastos/utils";

import { useEvents } from "@/modules/calendario/hooks/useEvents";
import DaySummary from "@/modules/calendario/components/DaySummary";
import { groupByDate } from "@/modules/calendario/utils";

import { useReminderTypes } from "@/modules/lembretes/hooks/useReminderTypes";
import ReminderWidget from "@/modules/lembretes/components/ReminderWidget";

const UPCOMING_EVENTS_LIMIT = 3;

/**
 * O Dashboard não tem hooks nem componentes próprios — só compõe o que
 * cada módulo já expõe (useTasks, useExpenses, useEvents,
 * useReminderTypes) com os seus próprios componentes de apresentação.
 */
export default function DashboardPage() {
  const today = todayIsoDate();

  const {
    tasks,
    tags,
    loading: tasksLoading,
    updateTask,
    updateTaskWithTags,
    deleteTask,
    createTag,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTasks();
  const todayTasks = useMemo(() => tasks.filter((task) => task.due_date === today), [tasks, today]);

  const now = new Date();
  const {
    expenses,
    budgets,
    categories: expenseCategories,
    loading: expensesLoading,
  } = useExpenses(now.getFullYear(), now.getMonth() + 1);
  const monthTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses],
  );

  const { items, loading: eventsLoading, deleteEvent } = useEvents();
  const upcomingByDate = useMemo(() => {
    const upcoming = items
      .filter((item) => item.date >= today)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .slice(0, UPCOMING_EVENTS_LIMIT);
    return groupByDate(upcoming);
  }, [items, today]);
  const upcomingDates = Array.from(upcomingByDate.keys());

  const { activeReminderTypes, loading: remindersLoading, updateReminderType } = useReminderTypes();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-2 text-zinc-400">Resumo do dia.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white">Tarefas de hoje</h2>
        {tasksLoading ? (
          <p className="text-sm text-zinc-500">A carregar...</p>
        ) : todayTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">Sem tarefas com prazo para hoje.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                tags={tags}
                onUpdate={updateTaskWithTags}
                onDelete={deleteTask}
                onStatusChange={(id, status) => updateTask(id, { status })}
                onCreateTag={createTag}
                onAddSubtask={addSubtask}
                onToggleSubtask={toggleSubtask}
                onDeleteSubtask={deleteSubtask}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-white">Gastos do mês</h2>
          <span className="text-sm text-zinc-400">
            Total: <span className="font-semibold text-white">{formatCurrency(monthTotal)}</span>
          </span>
        </div>
        {expensesLoading ? (
          <p className="text-sm text-zinc-500">A carregar...</p>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
            <CategoryBars expenses={expenses} budgets={budgets} categories={expenseCategories} />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white">Próximos eventos</h2>
        {eventsLoading ? (
          <p className="text-sm text-zinc-500">A carregar...</p>
        ) : upcomingDates.length === 0 ? (
          <p className="text-sm text-zinc-500">Sem eventos nem prazos próximos.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingDates.map((date) => (
              <DaySummary key={date} date={date} items={upcomingByDate.get(date) ?? []} onDeleteEvent={deleteEvent} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white">Lembretes de hoje</h2>
        {remindersLoading ? (
          <p className="text-sm text-zinc-500">A carregar...</p>
        ) : activeReminderTypes.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Ainda não tens lembretes ativos. Cria um em <span className="text-zinc-300">Lembretes</span>.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeReminderTypes.map((type) => (
              <ReminderWidget key={type.id} type={type} onUpdateType={updateReminderType} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
