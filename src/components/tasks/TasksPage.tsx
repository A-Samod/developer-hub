'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PriorityBadge, StatusBadge } from '@/components/tasks/StatusBadge';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import ListPagination from '@/components/ui/ListPagination';
import SelectDropdown from '@/components/ui/SelectDropdown';
import {
  formatDate,
  isDueToday,
  isOverdue,
  isUpcoming,
  priorityRank,
  todayDate,
} from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { useListPagination } from '@/lib/useListPagination';
import type { Priority, TaskStatus } from '@/types/models';
import {
  formatPriority,
  formatTaskStatus,
  PRIORITIES,
  TASK_STATUSES,
} from '@/types/models';

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
  const [dueOn, setDueOn] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newDue, setNewDue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    if (dueOn) {
      items = items.filter((t) => t.due_date === dueOn);
    } else {
      if (dueBucket === 'overdue')
        items = items.filter((t) => isOverdue(t.due_date, t.status === 'done'));
      if (dueBucket === 'today') items = items.filter((t) => isDueToday(t.due_date));
      if (dueBucket === 'upcoming') items = items.filter((t) => isUpcoming(t.due_date));
      if (dueBucket === 'none') items = items.filter((t) => !t.due_date);
    }

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
  }, [hub.state.tasks, view, query, categoryId, status, priority, dueBucket, dueOn]);

  const filterKey = `${view}|${query}|${categoryId}|${status}|${priority}|${dueBucket}|${dueOn}`;
  const {
    pageSize,
    setPageSize,
    currentPage,
    setPage,
    totalPages,
    pageStart,
    pageEnd,
    pagedItems: pagedTasks,
    total,
  } = useListPagination(tasks, filterKey);

  async function create() {
    if (!newTitle.trim()) return;
    const task = await hub.createTask({
      title: newTitle.trim(),
      description: '',
      category_id: newCategory || categories[0]?.id || null,
      status: newStatus,
      priority: newPriority,
      due_date: newDue || null,
      estimate_minutes: null,
      archived_at: null,
      is_favorite: false,
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
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Task Manager</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Structured development work items
          </p>
        </div>
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={() => setShowCreate((v) => !v)}
        >
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
            <SelectDropdown
              aria-label="Category"
              value={newCategory || categories[0]?.id || ''}
              onChange={setNewCategory}
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
                color: c.color,
              }))}
            />
            <SelectDropdown
              aria-label="Status"
              value={newStatus}
              onChange={(v) => setNewStatus(v as TaskStatus)}
              options={TASK_STATUSES.map((s) => ({
                value: s,
                label: formatTaskStatus(s),
              }))}
            />
            <SelectDropdown
              aria-label="Priority"
              value={newPriority}
              onChange={(v) => setNewPriority(v as Priority)}
              options={PRIORITIES.map((p) => ({
                value: p,
                label: formatPriority(p),
              }))}
            />
            <input
              type="date"
              className="input"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              min={todayDate()}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" className="btn-primary" onClick={() => void create()}>
              Create
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            className={`shrink-0 ${view === v.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <input
          className="input"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SelectDropdown
          aria-label="Category"
          value={categoryId}
          onChange={setCategoryId}
          options={[
            { value: '', label: 'All categories' },
            ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color })),
          ]}
        />
        <SelectDropdown
          aria-label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'All statuses' },
            ...TASK_STATUSES.map((s) => ({ value: s, label: formatTaskStatus(s) })),
          ]}
        />
        <SelectDropdown
          aria-label="Priority"
          value={priority}
          onChange={setPriority}
          options={[
            { value: '', label: 'All priorities' },
            ...PRIORITIES.map((p) => ({ value: p, label: formatPriority(p) })),
          ]}
        />
        <SelectDropdown
          aria-label="Due date"
          value={dueBucket}
          onChange={(v) => {
            setDueOn('');
            setDueBucket(v as DueBucket);
          }}
          options={[
            { value: 'all', label: 'Any due date' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'today', label: 'Today' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'none', label: 'No due date' },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input
            type="date"
            className="input flex-1 sm:flex-none"
            aria-label="Due on date"
            value={dueOn}
            onChange={(e) => {
              const value = e.target.value;
              setDueOn(value);
              if (value) setDueBucket('all');
            }}
          />
          {dueOn && (
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => setDueOn('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {deleteId && (
        <ConfirmBanner
          danger
          title="Delete this task?"
          message="This permanently removes the task. This cannot be undone."
          confirmLabel="Delete task"
          onConfirm={async () => {
            await hub.deleteTask(deleteId);
            setDeleteId(null);
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {tasks.length === 0 ? (
        <div className="panel px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No tasks match.
        </div>
      ) : (
        <>
          <ul className="panel divide-y divide-[var(--color-border)]">
            {pagedTasks.map((task) => {
              const cat = categories.find((c) => c.id === task.category_id);
              const overdue = isOverdue(task.due_date, task.status === 'done');
              return (
                <li key={task.id} className="list-row">
                  <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-medium ${overdue ? 'text-[var(--color-danger)]' : ''}`}
                      >
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
                  <div className="list-actions">
                    <button
                      type="button"
                      className="btn-danger w-full sm:w-auto"
                      onClick={() => setDeleteId(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <ListPagination
            pageStart={pageStart}
            pageEnd={pageEnd}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            perPageLabel="Tasks per page"
          />
        </>
      )}
    </div>
  );
}
