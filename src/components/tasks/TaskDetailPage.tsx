'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';
import MarkdownPreview from '@/components/markdown/MarkdownPreview';
import { formatDateTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import type { Priority, TaskStatus } from '@/types/models';
import { PRIORITIES, TASK_STATUSES } from '@/types/models';

export default function TaskDetailPage({ taskId }: { taskId: string }) {
  const hub = useHub();
  const router = useRouter();
  const existing = hub.getTask(taskId);
  const categories = useMemo(() => hub.listCategories('task'), [hub]);
  const notes = hub.state.notes;
  const snippets = hub.state.snippets;
  const resources = useMemo(() => hub.listTaskResources(taskId), [hub, taskId]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '');
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? 'todo');
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(existing?.due_date ?? '');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description);
    setCategoryId(existing.category_id ?? '');
    setStatus(existing.status);
    setPriority(existing.priority);
    setDueDate(existing.due_date ?? '');
  }, [existing?.id]);

  useEffect(() => {
    setSelectedResources(resources.map((r) => `${r.resource_type}:${r.resource_id}`));
  }, [resources]);

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

  async function save() {
    if (!title.trim()) {
      window.alert('Title is required');
      return;
    }
    setSaving(true);
    try {
      await hub.updateTask(taskId, {
        title: title.trim(),
        description,
        category_id: categoryId || null,
        status,
        priority,
        due_date: dueDate || null,
      });
      await hub.setTaskResources(
        taskId,
        selectedResources.map((key) => {
          const [resource_type, resource_id] = key.split(':') as ['note' | 'snippet', string];
          return { resource_type, resource_id };
        }),
      );
      setSavedMsg('Saved');
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this task?')) return;
    await hub.deleteTask(taskId);
    router.push('/tasks');
  }

  function toggleResource(key: string) {
    setSelectedResources((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Task details</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Updated {formatDateTime(existing.updated_at)}
            {existing.completed_at
              ? ` · Completed ${formatDateTime(existing.completed_at)}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tasks" className="btn-secondary">
            Back
          </Link>
          <button type="button" className="btn-danger" onClick={remove}>
            Delete
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {savedMsg && <div className="mb-3 alert-success">{savedMsg}</div>}

      <div className="panel grid gap-4 p-4">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className={!preview ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setPreview(false)}
          >
            Edit description
          </button>
          <button
            type="button"
            className={preview ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setPreview(true)}
          >
            Preview
          </button>
        </div>
        {preview ? (
          <div className="rounded-md border border-[var(--color-border)] p-4">
            <MarkdownPreview content={description} />
          </div>
        ) : (
          <MarkdownEditor value={description} onChange={setDescription} rows={10} />
        )}

        <div>
          <label className="label">Related notes & snippets</label>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-md border border-[var(--color-border)] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Notes
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {notes.map((n) => {
                  const key = `note:${n.id}`;
                  return (
                    <label key={n.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedResources.includes(key)}
                        onChange={() => toggleResource(key)}
                      />
                      {n.title}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="rounded-md border border-[var(--color-border)] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Snippets
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {snippets.map((s) => {
                  const key = `snippet:${s.id}`;
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedResources.includes(key)}
                        onChange={() => toggleResource(key)}
                      />
                      {s.title}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
