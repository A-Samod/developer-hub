'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';
import MarkdownPreview from '@/components/markdown/MarkdownPreview';
import CategorySelect from '@/components/ui/CategorySelect';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import ResourceMultiSelect from '@/components/ui/ResourceMultiSelect';
import RowOverflowMenu from '@/components/ui/RowOverflowMenu';
import SelectDropdown from '@/components/ui/SelectDropdown';
import {
  addDays,
  calendarDateInAppTz,
  dateToCompletedAtIso,
  formatDateTime,
  todayDate,
  tomorrowDate,
} from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import {
  newSubtaskId,
  parseTaskDescription,
  serializeTaskDescription,
  type TaskSubtask,
} from '@/lib/taskSubtasks';
import { toastSuccess } from '@/lib/toast';
import type { Priority, TaskStatus } from '@/types/models';
import {
  formatPriority,
  formatTaskStatus,
  PRIORITIES,
  TASK_STATUSES,
} from '@/types/models';

type DescMode = 'edit' | 'split' | 'preview';

export default function TaskDetailPage({ taskId }: { taskId: string }) {
  const hub = useHub();
  const router = useRouter();
  const existing = hub.getTask(taskId);
  const resources = useMemo(() => hub.listTaskResources(taskId), [hub, taskId]);
  const resourceOptions = useMemo(
    () => [
      ...hub.state.notes.map((n) => ({
        key: `note:${n.id}`,
        label: n.title,
        href: `/notes/${n.id}`,
        typeLabel: 'Note',
      })),
      ...hub.state.snippets.map((s) => ({
        key: `snippet:${s.id}`,
        label: s.title,
        href: `/snippets/${s.id}`,
        typeLabel: 'Snippet',
      })),
    ],
    [hub.state.notes, hub.state.snippets],
  );

  const parsedInitial = parseTaskDescription(existing?.description ?? '');

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(parsedInitial.body);
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(parsedInitial.subtasks);
  const [newSubtask, setNewSubtask] = useState('');
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '');
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? 'todo');
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(existing?.due_date ?? '');
  const [completedOn, setCompletedOn] = useState(
    existing?.completed_at ? calendarDateInAppTz(existing.completed_at) : '',
  );
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [descMode, setDescMode] = useState<DescMode>('edit');
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!existing) return;
    const parsed = parseTaskDescription(existing.description);
    setTitle(existing.title);
    setDescription(parsed.body);
    setSubtasks(parsed.subtasks);
    setCategoryId(existing.category_id ?? '');
    setStatus(existing.status);
    setPriority(existing.priority);
    setDueDate(existing.due_date ?? '');
    setCompletedOn(
      existing.completed_at ? calendarDateInAppTz(existing.completed_at) : '',
    );
  }, [existing?.id]);

  // Keep completed-on in sync when hub updates completed_at (e.g. after save).
  useEffect(() => {
    if (!existing || status !== 'done') return;
    if (existing.completed_at) {
      setCompletedOn(calendarDateInAppTz(existing.completed_at));
    }
  }, [existing?.completed_at, existing, status]);

  useEffect(() => {
    setSelectedResources(resources.map((r) => `${r.resource_type}:${r.resource_id}`));
  }, [resources]);

  const doneCount = subtasks.filter((s) => s.done).length;

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  if (!existing) {
    return (
      <div className="panel px-5 py-8">
        <p className="font-medium">Task not found</p>
        <Link href="/tasks" className="btn-secondary mt-4 inline-flex">
          Back to tasks
        </Link>
      </div>
    );
  }

  async function persist(patch?: {
    status?: TaskStatus;
    due_date?: string | null;
    completed_on?: string;
  }) {
    if (!title.trim()) {
      setFormError('Title is required');
      return false;
    }
    setFormError('');
    setSaving(true);
    try {
      const nextStatus = patch?.status ?? status;
      const nextCompletedOn =
        patch?.completed_on ??
        (nextStatus === 'done' ? completedOn || todayDate() : '');
      const completed_at =
        nextStatus === 'done' ? dateToCompletedAtIso(nextCompletedOn) : null;

      await hub.updateTask(taskId, {
        title: title.trim(),
        description: serializeTaskDescription(description, subtasks),
        category_id: categoryId || null,
        status: nextStatus,
        priority,
        due_date: patch?.due_date !== undefined ? patch.due_date : dueDate || null,
        completed_at,
      });
      await hub.setTaskResources(
        taskId,
        selectedResources.map((key) => {
          const [resource_type, resource_id] = key.split(':') as ['note' | 'snippet', string];
          return { resource_type, resource_id };
        }),
      );
      if (patch?.status) setStatus(patch.status);
      if (patch?.due_date !== undefined) setDueDate(patch.due_date ?? '');
      if (nextStatus === 'done') setCompletedOn(nextCompletedOn);
      else setCompletedOn('');
      setSavedMsg('Saved');
      toastSuccess('Saved');
      return true;
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    await persist();
  }

  async function markDone() {
    const day = completedOn || todayDate();
    setCompletedOn(day);
    await persist({ status: 'done', completed_on: day });
  }

  function onStatusChange(next: TaskStatus) {
    setStatus(next);
    if (next === 'done' && !completedOn) setCompletedOn(todayDate());
    if (next !== 'done') setCompletedOn('');
  }

  async function removeConfirmed() {
    await hub.deleteTask(taskId);
    router.push('/tasks');
  }

  function addSubtask() {
    const titleText = newSubtask.trim();
    if (!titleText) return;
    setSubtasks((prev) => [
      ...prev,
      { id: newSubtaskId(), title: titleText, done: false },
    ]);
    setNewSubtask('');
  }

  function toggleSubtask(id: string) {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );
  }

  function removeSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  }

  const isDone = status === 'done';

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Task Details</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-muted)]">
            {savedMsg ? (
              <>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-success)]" />
                  <span className="text-[var(--color-success)]">Saved</span>
                </span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span>Updated {formatDateTime(existing.updated_at)}</span>
            {existing.completed_at ? (
              <>
                <span aria-hidden>·</span>
                <span>Completed {formatDateTime(existing.completed_at)}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="list-actions w-full sm:w-auto">
          <Link href="/tasks" className="btn-secondary flex-1 sm:flex-none">
            Back
          </Link>
          {!isDone && (
            <button
              type="button"
              className="btn-secondary flex-1 sm:flex-none"
              onClick={() => void markDone()}
              disabled={saving}
            >
              ✓ Mark done
            </button>
          )}
          <button
            type="button"
            className="btn-primary flex-1 sm:flex-none"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <RowOverflowMenu
            items={[
              {
                label: 'Delete…',
                danger: true,
                onClick: () => setConfirmDelete(true),
              },
            ]}
          />
        </div>
      </div>

      {confirmDelete && (
        <ConfirmBanner
          danger
          title="Delete this task?"
          message="This permanently removes the task. This cannot be undone."
          confirmLabel="Delete task"
          onConfirm={() => void removeConfirmed()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {formError && (
        <div className="mb-3 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {formError}
        </div>
      )}

      <div className="panel grid gap-5 p-4">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="label">Category</label>
            <CategorySelect
              entityType="task"
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <SelectDropdown
              aria-label="Status"
              value={status}
              onChange={(v) => onStatusChange(v as TaskStatus)}
              options={TASK_STATUSES.map((s) => ({
                value: s,
                label: formatTaskStatus(s),
              }))}
            />
          </div>
          <div>
            <label className="label">Priority</label>
            <SelectDropdown
              aria-label="Priority"
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
              options={PRIORITIES.map((p) => ({
                value: p,
                label: formatPriority(p),
              }))}
            />
          </div>
          <div>
            <label className="label">Due date</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { label: 'Today', value: todayDate() },
                { label: 'Tomorrow', value: tomorrowDate() },
                { label: 'Next week', value: addDays(todayDate(), 7) },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    dueDate === opt.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                  onClick={() => setDueDate(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isDone && (
          <div className="max-w-sm">
            <label className="label">Completed on</label>
            <input
              type="date"
              className="input"
              value={completedOn || todayDate()}
              onChange={(e) => setCompletedOn(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { label: 'Today', value: todayDate() },
                { label: 'Yesterday', value: addDays(todayDate(), -1) },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    completedOn === opt.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                  onClick={() => setCompletedOn(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              Used for Completed day groups. Change this if you marked done late.
            </p>
          </div>
        )}

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="label mb-0">Description</label>
            <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-chip)] p-0.5">
              {(
                [
                  ['edit', 'Edit'],
                  ['split', 'Split'],
                  ['preview', 'Preview'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  className={`min-h-8 rounded-lg px-3 py-1 text-xs font-medium transition ${
                    descMode === mode
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                  onClick={() => setDescMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {descMode === 'edit' && (
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              rows={8}
              placeholder="Write Markdown…"
            />
          )}
          {descMode === 'preview' && (
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[var(--color-border)] p-4">
              <MarkdownPreview content={description} />
            </div>
          )}
          {descMode === 'split' && (
            <div className="grid max-h-[320px] gap-3 overflow-hidden md:grid-cols-2">
              <textarea
                className="input min-h-[240px] resize-none font-mono text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                spellCheck={false}
                placeholder="Write Markdown…"
                aria-label="Description editor"
              />
              <div className="min-h-[240px] overflow-y-auto rounded-xl border border-[var(--color-border)] p-3">
                <MarkdownPreview content={description} />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="label mb-0">
              Subtasks · {doneCount} of {subtasks.length}
            </label>
          </div>
          <ul className="space-y-1">
            {subtasks.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleSubtask(item.id)}
                  aria-label={item.title}
                />
                <span
                  className={`min-w-0 flex-1 text-sm ${
                    item.done ? 'text-[var(--color-muted)] line-through' : ''
                  }`}
                >
                  {item.title}
                </span>
                <button
                  type="button"
                  className="text-xs text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                  onClick={() => removeSubtask(item.id)}
                  aria-label={`Remove ${item.title}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              className="input max-w-md flex-1"
              placeholder="New subtask"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSubtask();
                }
              }}
            />
            <button
              type="button"
              className="rounded-md px-1.5 py-0.5 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-soft)] hover:underline"
              onClick={addSubtask}
            >
              + Add subtask
            </button>
          </div>
        </div>

        <div>
          <label className="label">Related notes & snippets</label>
          <ResourceMultiSelect
            options={resourceOptions}
            value={selectedResources}
            onChange={setSelectedResources}
          />
        </div>
      </div>
    </div>
  );
}
