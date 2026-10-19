'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import TaskRow from '@/components/tasks/TaskRow';
import CategorySelect from '@/components/ui/CategorySelect';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import LoadMoreButton from '@/components/ui/LoadMoreButton';
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown';
import SelectDropdown from '@/components/ui/SelectDropdown';
import {
  groupTasksByCompletedDay,
  matchesCompletedBucket,
  sortByCompletedAtDesc,
  type CompletedBucket,
} from '@/lib/completedTasks';
import {
  isDueToday,
  isOverdue,
  isUpcoming,
  priorityRank,
  todayDate,
} from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { toastSuccess, toastUndo } from '@/lib/toast';
import { useLoadMore } from '@/lib/useLoadMore';
import type { Priority, Task, TaskStatus } from '@/types/models';
import {
  formatPriority,
  formatTaskStatus,
  PRIORITIES,
  TASK_STATUSES,
} from '@/types/models';

type ViewKey = 'all' | 'my_day' | 'upcoming' | 'in_progress' | 'completed' | 'by_category';
type DueBucket = 'all' | 'overdue' | 'today' | 'upcoming' | 'none';
type SortKey = 'due' | 'priority' | 'updated';

export default function TasksPage() {
  const hub = useHub();
  const router = useRouter();
  const categories = useMemo(() => hub.listCategories('task'), [hub, hub.state.categories]);
  const [view, setView] = useState<ViewKey>('all');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priority, setPriority] = useState('');
  const [dueBucket, setDueBucket] = useState<DueBucket>('all');
  const [dueOn, setDueOn] = useState('');
  const [completedBucket, setCompletedBucket] = useState<CompletedBucket>('all');
  const [completedOn, setCompletedOn] = useState('');
  const [sort, setSort] = useState<SortKey>('due');
  const [showFilters, setShowFilters] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newDue, setNewDue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isCompletedView = view === 'completed';

  const filteredBase = useMemo(() => {
    let items = [...hub.state.tasks];
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    if (categoryId) items = items.filter((t) => t.category_id === categoryId);
    return items;
  }, [hub.state.tasks, query, categoryId]);

  const openTasks = useMemo(() => {
    let items = filteredBase.filter((t) => t.status !== 'done' && t.status !== 'cancelled');

    switch (view) {
      case 'my_day':
        items = items.filter((t) => isDueToday(t.due_date) || isOverdue(t.due_date));
        break;
      case 'upcoming':
        items = items.filter((t) => isUpcoming(t.due_date));
        break;
      case 'in_progress':
        items = filteredBase.filter((t) => t.status === 'in_progress');
        break;
      case 'completed':
        return [];
      case 'by_category':
        break;
      default:
        break;
    }

    if (statuses.length > 0) {
      items = items.filter((t) => statuses.includes(t.status));
    }
    if (priority) items = items.filter((t) => t.priority === priority);
    if (dueOn) {
      items = items.filter((t) => t.due_date === dueOn);
    } else {
      if (dueBucket === 'overdue') items = items.filter((t) => isOverdue(t.due_date, false));
      if (dueBucket === 'today') items = items.filter((t) => isDueToday(t.due_date));
      if (dueBucket === 'upcoming') items = items.filter((t) => isUpcoming(t.due_date));
      if (dueBucket === 'none') items = items.filter((t) => !t.due_date);
    }

    items.sort((a, b) => {
      if (sort === 'updated') return b.updated_at.localeCompare(a.updated_at);
      if (sort === 'priority') {
        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
      }
      const aOver = isOverdue(a.due_date, false) ? 0 : 1;
      const bOver = isOverdue(b.due_date, false) ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      const ad = a.due_date ?? '9999-99-99';
      const bd = b.due_date ?? '9999-99-99';
      return ad.localeCompare(bd);
    });

    return items;
  }, [filteredBase, view, statuses, priority, dueBucket, dueOn, sort]);

  const completedTasks = useMemo(() => {
    let items = filteredBase.filter((t) => t.status === 'done');
    items = items.filter((t) => matchesCompletedBucket(t, completedBucket, completedOn));
    return sortByCompletedAtDesc(items);
  }, [filteredBase, completedBucket, completedOn]);

  const {
    visibleItems: visibleCompleted,
    hasMore: completedHasMore,
    remaining: completedRemaining,
    loadMore: loadMoreCompleted,
    total: completedTotal,
    visibleCount: completedVisibleCount,
  } = useLoadMore(
    completedTasks,
    `${view}|completed|${query}|${categoryId}|${completedBucket}|${completedOn}`,
    isCompletedView ? 12 : 6,
  );

  const completedGroups = useMemo(
    () => groupTasksByCompletedDay(visibleCompleted),
    [visibleCompleted],
  );

  const openPanelFiltersActive =
    statuses.length > 0 ||
    Boolean(priority) ||
    dueBucket !== 'all' ||
    Boolean(dueOn);
  const completedPanelFiltersActive =
    completedBucket !== 'all' || Boolean(completedOn);
  const panelFiltersActive =
    Boolean(categoryId) ||
    (isCompletedView ? completedPanelFiltersActive : openPanelFiltersActive);
  const filtersActive = Boolean(query.trim()) || panelFiltersActive;
  const panelFilterCount = isCompletedView
    ? Number(Boolean(categoryId)) +
      Number(completedBucket !== 'all' || Boolean(completedOn))
    : Number(Boolean(categoryId)) +
      Number(statuses.length > 0) +
      Number(Boolean(priority)) +
      Number(dueBucket !== 'all' || Boolean(dueOn));

  const showOpenList = view !== 'completed';
  const showCompletedBlock = view === 'all' || view === 'completed';
  const emptyPage =
    (showOpenList ? openTasks.length === 0 : true) &&
    (showCompletedBlock ? completedTasks.length === 0 : true);

  function clearFilters() {
    setQuery('');
    setCategoryId('');
    setStatuses([]);
    setPriority('');
    setDueBucket('all');
    setDueOn('');
    setCompletedBucket('all');
    setCompletedOn('');
  }

  async function create() {
    if (!newTitle.trim()) return;
    const task = await hub.createTask({
      title: newTitle.trim(),
      description: '',
      category_id: newCategory || null,
      status: newStatus,
      priority: newPriority,
      due_date: newDue || null,
      estimate_minutes: null,
      archived_at: null,
      is_favorite: false,
    });
    toastSuccess('Task created');
    router.push(`/tasks/${task.id}`);
  }

  async function toggleDone(task: Task, done: boolean) {
    await hub.updateTask(task.id, {
      status: done ? 'done' : 'todo',
      completed_at: done ? new Date().toISOString() : null,
    });
    toastSuccess(done ? 'Task completed' : 'Task reopened');
  }

  async function toggleMyDay(task: Task) {
    const inMyDay = isDueToday(task.due_date) || isOverdue(task.due_date);
    await hub.updateTask(task.id, {
      due_date: inMyDay ? null : todayDate(),
    });
    toastSuccess(inMyDay ? 'Removed from My day' : 'Added to My day');
  }

  async function duplicate(task: Task) {
    const copy = await hub.createTask({
      title: `${task.title} (copy)`,
      description: task.description,
      category_id: task.category_id,
      status: 'todo',
      priority: task.priority,
      due_date: task.due_date,
      estimate_minutes: task.estimate_minutes,
      archived_at: null,
      is_favorite: false,
    });
    toastSuccess('Task duplicated');
    router.push(`/tasks/${copy.id}`);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const snapshot = hub.getTask(deleteId);
    await hub.deleteTask(deleteId);
    setDeleteId(null);
    if (!snapshot) return;
    toastUndo('Task deleted', async () => {
      await hub.createTask({
        title: snapshot.title,
        description: snapshot.description,
        category_id: snapshot.category_id,
        status: snapshot.status,
        priority: snapshot.priority,
        due_date: snapshot.due_date,
        estimate_minutes: snapshot.estimate_minutes,
        archived_at: snapshot.archived_at,
        is_favorite: snapshot.is_favorite,
        completed_at: snapshot.completed_at,
      });
      toastSuccess('Task restored');
    });
  }

  const views: { key: ViewKey; label: string }[] = [
    { key: 'my_day', label: 'My day' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'by_category', label: 'By category' },
  ];

  function renderRows(items: Task[]) {
    return items.map((task) => {
      const cat = categories.find((c) => c.id === task.category_id);
      const done = task.status === 'done';
      return (
        <TaskRow
          key={task.id}
          task={task}
          category={cat}
          onToggleDone={(isDone) => void toggleDone(task, isDone)}
          onDuplicate={() => void duplicate(task)}
          onDelete={() => setDeleteId(task.id)}
          onToggleMyDay={done ? undefined : () => void toggleMyDay(task)}
        />
      );
    });
  }

  function renderCompletedGrouped() {
    if (completedTasks.length === 0) {
      return (
        <div className="px-4 py-6 text-sm text-[var(--color-muted)]">No completed tasks.</div>
      );
    }
    return (
      <>
        {completedGroups.map((group) => (
          <div key={group.key}>
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {group.label} · {group.tasks.length}
              </h3>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">{renderRows(group.tasks)}</ul>
          </div>
        ))}
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <LoadMoreButton
            hasMore={completedHasMore}
            remaining={completedRemaining}
            total={completedTotal}
            visibleCount={completedVisibleCount}
            onLoadMore={loadMoreCompleted}
            itemLabel="completed"
          />
        </div>
      </>
    );
  }

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading tasks…</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
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
            <CategorySelect
              entityType="task"
              value={newCategory}
              onChange={setNewCategory}
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
            onClick={() => {
              setView(v.key);
              if (v.key === 'completed') setShowCompleted(true);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:min-w-[14rem] sm:flex-1">
          <input
            className={`input w-full ${query ? 'pr-10' : ''}`}
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          className={showFilters || panelFiltersActive ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters{panelFilterCount > 0 ? ` · ${panelFilterCount}` : ''}
        </button>
        {filtersActive && (
          <button
            type="button"
            className="btn-secondary"
            onClick={clearFilters}
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        )}
        {!isCompletedView && (
          <SelectDropdown
            aria-label="Sort"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: 'due', label: 'Sort: Due date' },
              { value: 'priority', label: 'Sort: Priority' },
              { value: 'updated', label: 'Sort: Updated' },
            ]}
          />
        )}
      </div>

      {showFilters && (
        <div className="filter-bar mb-4">
          <SelectDropdown
            aria-label="Category"
            value={categoryId}
            onChange={setCategoryId}
            options={[
              { value: '', label: 'All categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color })),
            ]}
          />
          {isCompletedView ? (
            <>
              <SelectDropdown
                aria-label="Completed when"
                value={completedOn ? 'exact' : completedBucket}
                onChange={(v) => {
                  if (v === 'exact') return;
                  setCompletedOn('');
                  setCompletedBucket(v as CompletedBucket);
                }}
                options={[
                  { value: 'all', label: 'Any completion date' },
                  { value: 'today', label: 'Completed today' },
                  { value: 'yesterday', label: 'Completed yesterday' },
                  { value: 'week', label: 'Completed this week' },
                  ...(completedOn
                    ? [{ value: 'exact', label: `On ${completedOn}` }]
                    : []),
                ]}
              />
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <input
                  type="date"
                  className="input flex-1 sm:flex-none"
                  aria-label="Completed on date"
                  value={completedOn}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCompletedOn(value);
                    if (value) setCompletedBucket('all');
                  }}
                />
                {completedOn && (
                  <button
                    type="button"
                    className="btn-secondary shrink-0"
                    aria-label="Clear completed date"
                    onClick={() => setCompletedOn('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <MultiSelectDropdown
                aria-label="Status"
                values={statuses}
                onChange={setStatuses}
                placeholder="All statuses"
                options={TASK_STATUSES.map((s) => ({
                  value: s,
                  label: formatTaskStatus(s),
                }))}
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
                value={dueOn ? 'exact' : dueBucket}
                onChange={(v) => {
                  if (v === 'exact') return;
                  setDueOn('');
                  setDueBucket(v as DueBucket);
                }}
                options={[
                  { value: 'all', label: 'Any due date' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'today', label: 'Today' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'none', label: 'No due date' },
                  ...(dueOn ? [{ value: 'exact', label: `On ${dueOn}` }] : []),
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
                    aria-label="Clear due date"
                    onClick={() => setDueOn('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </>
          )}
          {filtersActive && (
            <button type="button" className="btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {deleteId && (
        <ConfirmBanner
          danger
          title="Delete this task?"
          message="This permanently removes the task. You can Undo from the toast for a short time."
          confirmLabel="Delete task"
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {emptyPage ? (
        <div className="panel px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No tasks match.
        </div>
      ) : (
        <>
          {showOpenList && view !== 'all' && (
            <ul className="panel mb-4 divide-y divide-[var(--color-border)]">
              {openTasks.length === 0 ? (
                <li className="px-4 py-6 text-sm text-[var(--color-muted)]">No open tasks.</li>
              ) : (
                renderRows(openTasks)
              )}
            </ul>
          )}

          {view === 'all' && (
            <>
              <div className="mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Open · {openTasks.length}
                </h2>
              </div>
              {openTasks.length === 0 ? (
                <div className="panel mb-4 px-4 py-6 text-sm text-[var(--color-muted)]">
                  No open tasks.
                </div>
              ) : (
                <ul className="panel mb-4 divide-y divide-[var(--color-border)]">
                  {renderRows(openTasks)}
                </ul>
              )}

              <div className="panel overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Completed · {completedTasks.length}
                  </h2>
                  <button
                    type="button"
                    className="btn-secondary min-h-8 px-3 py-1.5 text-xs"
                    onClick={() => setShowCompleted((v) => !v)}
                  >
                    {showCompleted ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showCompleted && renderCompletedGrouped()}
              </div>
            </>
          )}

          {isCompletedView && (
            <div className="panel overflow-hidden">
              <div className="px-4 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Completed · {completedTasks.length}
                </h2>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Newest first · grouped by completion day
                </p>
              </div>
              {renderCompletedGrouped()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
