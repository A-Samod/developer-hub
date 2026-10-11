'use client';

import { useMemo, useState } from 'react';
import { PriorityBadge } from '@/components/tasks/StatusBadge';
import { formatDate, isDueToday, isOverdue, isUpcoming } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import type { Priority } from '@/types/models';
import { PRIORITIES } from '@/types/models';

type CompletionFilter = 'all' | 'active' | 'completed';
type DueFilter = 'all' | 'overdue' | 'today' | 'upcoming' | 'none';
type SortKey = 'created' | 'due';

export default function TodosPage() {
  const hub = useHub();
  const [title, setTitle] = useState('');
  const [completion, setCompletion] = useState<CompletionFilter>('all');
  const [priority, setPriority] = useState('');
  const [due, setDue] = useState<DueFilter>('all');
  const [sort, setSort] = useState<SortKey>('created');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDue, setEditDue] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const todos = useMemo(() => {
    let items = [...hub.state.todos];
    if (completion === 'active') items = items.filter((t) => !t.is_completed);
    if (completion === 'completed') items = items.filter((t) => t.is_completed);
    if (priority) items = items.filter((t) => t.priority === priority);
    if (due === 'overdue') items = items.filter((t) => isOverdue(t.due_date, t.is_completed));
    if (due === 'today') items = items.filter((t) => isDueToday(t.due_date));
    if (due === 'upcoming') items = items.filter((t) => isUpcoming(t.due_date));
    if (due === 'none') items = items.filter((t) => !t.due_date);
    items.sort((a, b) => {
      if (sort === 'due') {
        const ad = a.due_date ?? '9999-99-99';
        const bd = b.due_date ?? '9999-99-99';
        return ad.localeCompare(bd);
      }
      return b.created_at.localeCompare(a.created_at);
    });
    return items;
  }, [hub.state.todos, completion, priority, due, sort]);

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await hub.createTodo({ title: title.trim() });
    setTitle('');
  }

  function startEdit(id: string) {
    const todo = hub.state.todos.find((t) => t.id === id);
    if (!todo) return;
    setEditingId(id);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditDue(todo.due_date ?? '');
    setEditNotes(todo.notes);
  }

  async function saveEdit() {
    if (!editingId) return;
    await hub.updateTodo(editingId, {
      title: editTitle.trim(),
      priority: editPriority,
      due_date: editDue || null,
      notes: editNotes,
    });
    setEditingId(null);
  }

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading to-dos…</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">To-dos</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Quick capture — title only to add</p>
      </div>

      <form onSubmit={quickAdd} className="panel mb-4 flex flex-col gap-2 p-3 sm:flex-row">
        <input
          className="input"
          placeholder="Add a to-do…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0 sm:w-auto">
          Add
        </button>
      </form>

      <div className="filter-bar">
        <select
          className="input"
          value={completion}
          onChange={(e) => setCompletion(e.target.value as CompletionFilter)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="input"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={due}
          onChange={(e) => setDue(e.target.value as DueFilter)}
        >
          <option value="all">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="none">No due date</option>
        </select>
        <select
          className="input"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="created">Sort: created</option>
          <option value="due">Sort: due date</option>
        </select>
      </div>

      {todos.length === 0 ? (
        <div className="panel px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No to-dos match these filters.
        </div>
      ) : (
        <ul className="panel divide-y divide-[var(--color-border)]">
          {todos.map((todo) => {
            const overdue = isOverdue(todo.due_date, todo.is_completed);
            const editing = editingId === todo.id;
            return (
              <li key={todo.id} className="px-4 py-3">
                {!editing ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={todo.is_completed}
                        onChange={(e) =>
                          void hub.updateTodo(todo.id, { is_completed: e.target.checked })
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`font-medium ${todo.is_completed ? 'text-[var(--color-muted)] line-through' : ''} ${overdue ? 'text-[var(--color-danger)]' : ''}`}
                        >
                          {todo.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                          <PriorityBadge priority={todo.priority} />
                          <span>Due {formatDate(todo.due_date)}</span>
                          {overdue && <span className="text-[var(--color-danger)]">Overdue</span>}
                          {todo.notes && <span>· {todo.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="list-actions">
                      <button
                        type="button"
                        className="btn-secondary flex-1 sm:flex-none"
                        onClick={() => startEdit(todo.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger flex-1 sm:flex-none"
                        onClick={async () => {
                          if (window.confirm('Delete this to-do?')) await hub.deleteTodo(todo.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <input
                      className="input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <div className="grid gap-3 md:grid-cols-3">
                      <select
                        className="input"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as Priority)}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        className="input"
                        value={editDue}
                        onChange={(e) => setEditDue(e.target.value)}
                      />
                      <input
                        className="input"
                        placeholder="Notes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn-primary" onClick={saveEdit}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
