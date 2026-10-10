'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PriorityBadge, StatusBadge } from '@/components/tasks/StatusBadge';
import {
  formatDate,
  isDueToday,
  isOverdue,
  isUpcoming,
  priorityRank,
  todayDate,
} from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import type { Priority, TaskStatus } from '@/types/models';
import { PRIORITIES, TASK_STATUSES } from '@/types/models';

type ViewKey = 'all' | 'my_day' | 'upcoming' | 'in_progress' | 'completed' | 'by_category';
type DueBucket = 'all' | 'overdue' | 'today' | 'upcoming' | 'none';

export default function TasksPage() {
  const hub = useHub();
  const router = useRouter();
  const categories = useMemo(() => hub.listCategories('task'), [hub]);
  const [view, setView] = useState<ViewKey>('all');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dueBucket, setDueBucket] = useState<DueBucket>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newDue, setNewDue] = useState('');

  const tasks = useMemo(() => {
    let items = [...hub.state.tasks];
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }

    switch (view) {
      case 'my_day':
        items = items.filter(
          (t) =>
            t.status !== 'done' &&
            t.status !== 'cancelled' &&
            (isDueToday(t.due_date) || isOverdue(t.due_date)),
        );
        break;
      case 'upcoming':
        items = items.filter(
          (t) => t.status !== 'done' && t.status !== 'cancelled' && isUpcoming(t.due_date),
        );
        break;
      case 'in_progress':
        items = items.filter((t) => t.status === 'in_progress');
        break;
      case 'completed':
        items = items.filter((t) => t.status === 'done');
        break;
      case 'by_category':
        if (categoryId) items = items.filter((t) => t.category_id === categoryId);
        break;
      default:
        break;
    }

    if (view !== 'by_category' && categoryId) {
      items = items.filter((t) => t.category_id === categoryId);
    }
    if (status) items = items.filter((t) => t.status === status);
    if (priority) items = items.filter((t) => t.priority === priority);
    if (dueBucket === 'overdue')
      items = items.filter((t) => isOverdue(t.due_date, t.status === 'done'));
    if (dueBucket === 'today') items = items.filter((t) => isDueToday(t.due_date));
    if (dueBucket === 'upcoming') items = items.filter((t) => isUpcoming(t.due_date));
    if (dueBucket === 'none') items = items.filter((t) => !t.due_date);

    items.sort((a, b) => {
      const aOver = isOverdue(a.due_date, a.status === 'done') ? 0 : 1;
      const bOver = isOverdue(b.due_date, b.status === 'done') ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      const pr = priorityRank(a.priority) - priorityRank(b.priority);
      if (pr !== 0) return pr;
      const ad = a.due_date ?? '9999-99-99';
      const bd = b.due_date ?? '9999-99-99';
      return ad.localeCompare(bd);
    });

    return items;
  }, [hub.state.tasks, view, query, categoryId, status, priority, dueBucket]);

  async function create() {
    if (!newTitle.trim()) return;
    const task = await hub.createTask({
      title: newTitle.trim(),
      description: '',
      category_id: newCategory || categories[0]?.id || null,
      status: newStatus,
      priority: newPriority,
      due_date: newDue || null,
    });
    router.push(`/tasks/${task.id}`);
  }

  const views: { key: ViewKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'my_day', label: 'My day' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'by_category', label: 'By category' },
  ];

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading tasks…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Task Manager</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Structured development work items
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          New task
        </button>
      </div>

      {showCreate && (
        <div className="panel mb-4 grid gap-3 p-4">
          <input
            className="input"
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-4">
            <select
              className="input"
              value={newCategory || categories[0]?.id || ''}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Priority)}
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
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              min={todayDate()}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={create}>
              Create
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            className={view === v.key ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="panel mb-4 flex flex-wrap gap-3 p-3">
        <input
          className="input max-w-xs"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input max-w-[180px]"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input max-w-[160px]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input max-w-[140px]"
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
          className="input max-w-[160px]"
          value={dueBucket}
          onChange={(e) => setDueBucket(e.target.value as DueBucket)}
        >
          <option value="all">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="none">No due date</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="panel px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No tasks match.
        </div>
      ) : (
        <ul className="panel divide-y divide-[var(--color-border)]">
          {tasks.map((task) => {
            const cat = categories.find((c) => c.id === task.category_id);
            const overdue = isOverdue(task.due_date, task.status === 'done');
            return (
              <li
                key={task.id}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-[var(--color-surface)]"
              >
                <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${overdue ? 'text-[var(--color-danger)]' : ''}`}>
                      {task.title}
                    </span>
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                    {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                    <span>Due {formatDate(task.due_date)}</span>
                    {overdue && <span className="text-[var(--color-danger)]">Overdue</span>}
                  </div>
                </Link>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={async () => {
                    if (window.confirm('Delete this task?')) await hub.deleteTask(task.id);
                  }}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
