'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  addDays,
  formatRelativeTime,
  formatWeekdayDate,
  isDueToday,
  isOverdue,
  todayDate,
  tomorrowDate,
} from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { stripMarkdownPreview } from '@/lib/textPreview';
import { toastSuccess } from '@/lib/toast';

function dueLabel(due: string | null): { text: string; className: string } {
  if (isOverdue(due)) return { text: 'Overdue', className: 'text-[var(--color-danger)]' };
  if (isDueToday(due)) return { text: 'Due today', className: 'text-[var(--color-warning)]' };
  if (due === tomorrowDate()) return { text: 'Tomorrow', className: 'text-[var(--color-muted)]' };
  if (due === addDays(todayDate(), 2))
    return { text: 'In 2 days', className: 'text-[var(--color-muted)]' };
  return { text: due ? 'Upcoming' : 'No due date', className: 'text-[var(--color-muted)]' };
}

export default function DashboardPage() {
  const hub = useHub();
  const { state, loading, error } = hub;

  const stats = useMemo(() => {
    const openTasks = state.tasks.filter(
      (t) => !t.archived_at && t.status !== 'done' && t.status !== 'cancelled',
    );
    const overdue = openTasks.filter((t) => isOverdue(t.due_date)).length;
    return {
      open: openTasks.length,
      overdue,
      notes: state.notes.length,
      snippets: state.snippets.length,
    };
  }, [state.tasks, state.notes.length, state.snippets.length]);

  const recentNotes = useMemo(
    () => [...state.notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6),
    [state.notes],
  );

  const myDay = useMemo(() => {
    return state.tasks
      .filter(
        (t) =>
          !t.archived_at &&
          t.status !== 'done' &&
          t.status !== 'cancelled' &&
          (isDueToday(t.due_date) || isOverdue(t.due_date) || t.due_date === tomorrowDate()),
      )
      .sort((a, b) => {
        const aOver = isOverdue(a.due_date) ? 0 : isDueToday(a.due_date) ? 1 : 2;
        const bOver = isOverdue(b.due_date) ? 0 : isDueToday(b.due_date) ? 1 : 2;
        return aOver - bOver;
      })
      .slice(0, 8);
  }, [state.tasks]);

  const favorites = useMemo(() => {
    const notes = state.notes
      .filter((n) => n.is_favorite)
      .map((n) => ({
        id: n.id,
        title: n.title,
        type: 'Note' as const,
        href: `/notes/${n.id}`,
        updated_at: n.updated_at,
      }));
    const snippets = state.snippets
      .filter((s) => s.is_favorite)
      .map((s) => ({
        id: s.id,
        title: s.title,
        type: 'Snippet' as const,
        href: `/snippets/${s.id}`,
        updated_at: s.updated_at,
      }));
    return [...notes, ...snippets]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 6);
  }, [state.notes, state.snippets]);

  async function toggleTaskDone(id: string, done: boolean) {
    await hub.updateTask(id, {
      status: done ? 'done' : 'todo',
      completed_at: done ? new Date().toISOString() : null,
    });
    toastSuccess(done ? 'Task completed' : 'Task reopened');
  }

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
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{formatWeekdayDate()}</p>
        </div>
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
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Open tasks', value: stats.open },
          {
            label: 'Overdue',
            value: stats.overdue,
            valueClass: stats.overdue > 0 ? 'text-[var(--color-danger)]' : '',
          },
          { label: 'Notes', value: stats.notes },
          { label: 'Snippets', value: stats.snippets },
        ].map((card) => (
          <div key={card.label} className="panel px-4 py-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {card.label}
            </div>
            <div
              className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${card.valueClass ?? ''}`}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

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
              {recentNotes.map((note) => {
                const cat = hub.getCategory(note.category_id);
                return (
                  <li key={note.id}>
                    <Link
                      href={`/notes/${note.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{note.title}</div>
                        {note.content_md && (
                          <p className="mt-0.5 line-clamp-2 text-sm text-[var(--color-muted)]">
                            {stripMarkdownPreview(note.content_md)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                        {cat && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${cat.color}22`,
                              color: cat.color,
                            }}
                          >
                            {cat.name}
                          </span>
                        )}
                        <span className="text-xs text-[var(--color-muted)]">
                          {formatRelativeTime(note.updated_at)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                My day
              </h2>
              <Link href="/tasks?view=my_day" className="text-sm text-[var(--color-accent)]">
                View all
              </Link>
            </div>
            {myDay.length === 0 ? (
              <div className="panel px-4 py-6 text-sm text-[var(--color-muted)]">
                Nothing due today or overdue.
              </div>
            ) : (
              <ul className="panel divide-y divide-[var(--color-border)]">
                {myDay.map((task) => {
                  const due = dueLabel(task.due_date);
                  return (
                    <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        className="shrink-0"
                        checked={false}
                        aria-label={`Complete ${task.title}`}
                        onChange={() => void toggleTaskDone(task.id, true)}
                      />
                      <Link
                        href={`/tasks/${task.id}`}
                        className="min-w-0 flex-1 truncate font-medium hover:opacity-90"
                      >
                        {task.title}
                      </Link>
                      <span
                        className={`shrink-0 text-xs font-medium ${due.className}`}
                      >
                        {due.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Favorites
            </h2>
            {favorites.length === 0 ? (
              <div className="panel px-4 py-6 text-sm text-[var(--color-muted)]">
                Star notes or snippets to pin them here.
              </div>
            ) : (
              <ul className="panel divide-y divide-[var(--color-border)]">
                {favorites.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-[var(--color-surface)]"
                    >
                      <span className="truncate font-medium">{item.title}</span>
                      <span className="shrink-0 text-xs text-[var(--color-muted)]">{item.type}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
