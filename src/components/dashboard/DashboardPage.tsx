'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatDate, isDueToday, isOverdue, priorityRank, todayDate } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { PriorityBadge, StatusBadge } from '@/components/tasks/StatusBadge';

export default function DashboardPage() {
  const { state, loading, error } = useHub();

  const recentNotes = useMemo(
    () => [...state.notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5),
    [state.notes],
  );

  const attentionTasks = useMemo(() => {
    return state.tasks
      .filter(
        (t) =>
          !t.archived_at &&
          (t.status === 'in_progress' ||
            (t.status !== 'done' &&
              t.status !== 'cancelled' &&
              (isDueToday(t.due_date) || isOverdue(t.due_date)))),
      )
      .sort((a, b) => {
        const aOver = isOverdue(a.due_date) ? 0 : 1;
        const bOver = isOverdue(b.due_date) ? 0 : 1;
        if (aOver !== bOver) return aOver - bOver;
        return priorityRank(a.priority) - priorityRank(b.priority);
      })
      .slice(0, 6);
  }, [state.tasks]);

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading dashboard…</p>;
  }

  if (error) {
    return (
      <div className="panel px-5 py-8 text-[var(--color-danger)]">
        Failed to load data: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Today is {formatDate(todayDate())}
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/notes/new" className="btn-primary">
            New note
          </Link>
          <Link href="/snippets/new" className="btn-secondary">
            New snippet
          </Link>
          <Link href="/tasks" className="btn-secondary">
            New task
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Recent notes
            </h2>
            <Link href="/notes" className="text-sm text-[var(--color-accent)]">
              View all
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <div className="panel px-4 py-6 text-sm text-[var(--color-muted)]">No notes yet.</div>
          ) : (
            <ul className="panel divide-y divide-[var(--color-border)]">
              {recentNotes.map((note) => (
                <li key={note.id}>
                  <Link
                    href={`/notes/${note.id}`}
                    className="block px-4 py-3 hover:bg-[var(--color-surface)]"
                  >
                    <div className="font-medium">{note.title}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Updated {formatDate(note.updated_at)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Tasks needing attention
            </h2>
            <Link href="/tasks" className="text-sm text-[var(--color-accent)]">
              View all
            </Link>
          </div>
          {attentionTasks.length === 0 ? (
            <div className="panel px-4 py-6 text-sm text-[var(--color-muted)]">
              No overdue, due-today, or in-progress tasks.
            </div>
          ) : (
            <ul className="panel divide-y divide-[var(--color-border)]">
              {attentionTasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-[var(--color-surface)]"
                  >
                    <div>
                      <div
                        className={`font-medium ${isOverdue(task.due_date) ? 'text-[var(--color-danger)]' : ''}`}
                      >
                        {task.title}
                      </div>
                      <div className="mt-1 text-xs text-[var(--color-muted)]">
                        Due {formatDate(task.due_date)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
