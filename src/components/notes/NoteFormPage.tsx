'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';
import MarkdownPreview from '@/components/markdown/MarkdownPreview';
import { useHub } from '@/lib/hub/HubProvider';

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function NoteFormPage({ noteId }: { noteId?: string }) {
  const hub = useHub();
  const router = useRouter();
  const existing = noteId ? hub.getNote(noteId) : undefined;
  const categories = useMemo(() => hub.listCategories('note'), [hub]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content_md ?? '');
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '');
  const [tags, setTags] = useState((existing?.tags ?? []).join(', '));
  const [favorite, setFavorite] = useState(existing?.is_favorite ?? false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [dirty, setDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setContent(existing.content_md);
    setCategoryId(existing.category_id ?? '');
    setTags(existing.tags.join(', '));
    setFavorite(existing.is_favorite);
  }, [existing?.id]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  if (noteId && !existing) {
    return (
      <div className="panel px-5 py-8">
        <p className="font-medium">Note not found</p>
        <Link href="/notes" className="btn-secondary mt-4 inline-flex">
          Back to notes
        </Link>
      </div>
    );
  }

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
      setSavedMsg('');
    };
  }

  async function save() {
    if (!title.trim()) {
      window.alert('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content_md: content,
        category_id: categoryId || null,
        tags: parseTags(tags),
        is_favorite: favorite,
      };
      if (existing) {
        await hub.updateNote(existing.id, payload);
        setDirty(false);
        setSavedMsg('Saved');
      } else {
        const note = await hub.createNote(payload);
        setDirty(false);
        router.replace(`/notes/${note.id}`);
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    if (!window.confirm('Delete this note?')) return;
    await hub.deleteNote(existing.id);
    router.push('/notes');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {existing ? 'Edit note' : 'New note'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Explicit save · unsaved changes are warned on leave
          </p>
        </div>
        <div className="list-actions w-full sm:w-auto">
          <Link
            href="/notes"
            className="btn-secondary flex-1 sm:flex-none"
            onClick={(e) => {
              if (dirty && !window.confirm('Discard unsaved changes?')) e.preventDefault();
            }}
          >
            Back
          </Link>
          {existing && (
            <button type="button" className="btn-danger flex-1 sm:flex-none" onClick={remove}>
              Delete
            </button>
          )}
          <button
            type="button"
            className="btn-primary flex-1 sm:flex-none"
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {savedMsg && <div className="mb-3 alert-success">{savedMsg}</div>}

      <div className="panel grid gap-4 p-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => markDirty(setTitle)(e.target.value)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => markDirty(setCategoryId)(e.target.value)}
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
            <label className="label">Tags (comma-separated)</label>
            <input
              className="input"
              value={tags}
              onChange={(e) => markDirty(setTags)(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => markDirty(setFavorite)(e.target.checked)}
              />
              Favorite
            </label>
          </div>
        </div>

        <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
          <button
            type="button"
            className={mode === 'edit' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMode('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            className={mode === 'preview' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMode('preview')}
          >
            Preview
          </button>
        </div>

        {mode === 'edit' ? (
          <MarkdownEditor value={content} onChange={markDirty(setContent)} />
        ) : (
          <div className="min-h-[280px] rounded-md border border-[var(--color-border)] p-4">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
