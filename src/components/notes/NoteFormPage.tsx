'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';
import MarkdownPreview from '@/components/markdown/MarkdownPreview';
import MarkdownToolbar from '@/components/markdown/MarkdownToolbar';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import RowOverflowMenu from '@/components/ui/RowOverflowMenu';
import SelectDropdown from '@/components/ui/SelectDropdown';
import TagChipInput from '@/components/ui/TagChipInput';
import { formatRelativeTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { countMarkdownWords } from '@/lib/markdownInsert';
import { toastSuccess } from '@/lib/toast';

type EditorMode = 'edit' | 'split' | 'preview';

export default function NoteFormPage({ noteId }: { noteId?: string }) {
  const hub = useHub();
  const router = useRouter();
  const existing = noteId ? hub.getNote(noteId) : undefined;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const categories = useMemo(
    () => hub.state.categories.filter((c) => c.entity_type === 'note'),
    [hub.state.categories],
  );
  const tagSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const n of hub.state.notes) for (const t of n.tags) set.add(t);
    for (const s of hub.state.snippets) for (const t of s.tags) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [hub.state.notes, hub.state.snippets]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content_md ?? '');
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [favorite, setFavorite] = useState(existing?.is_favorite ?? false);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<'delete' | 'discard' | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setContent(existing.content_md);
    setCategoryId(existing.category_id ?? '');
    setTags(existing.tags);
    setFavorite(existing.is_favorite);
  }, [existing?.id]);

  useEffect(() => {
    if (!existing || dirty) return;
    setCategoryId(existing.category_id ?? '');
  }, [existing?.category_id, existing, dirty]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const wordCount = countMarkdownWords(content);

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
      setJustSaved(false);
    };
  }

  async function save() {
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content_md: content,
        category_id: categoryId || null,
        tags,
        is_favorite: favorite,
      };
      if (existing) {
        await hub.updateNote(existing.id, payload);
        setDirty(false);
        setJustSaved(true);
        toastSuccess('Saved');
      } else {
        const note = await hub.createNote(payload);
        setDirty(false);
        setJustSaved(true);
        toastSuccess('Saved');
        router.replace(`/notes/${note.id}`);
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function removeConfirmed() {
    if (!existing) return;
    await hub.deleteNote(existing.id);
    router.push('/notes');
  }

  function statusLine() {
    if (dirty) {
      return <span className="text-[var(--color-warning)]">Unsaved changes</span>;
    }
    if (justSaved || existing) {
      const when = existing ? formatRelativeTime(existing.updated_at) : 'just now';
      return (
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-success)]" />
          <span className="text-[var(--color-success)]">Saved</span>
          <span aria-hidden>·</span>
          <span>{when}</span>
        </span>
      );
    }
    return <span>Draft</span>;
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {existing ? 'Edit note' : 'New note'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{statusLine()}</p>
        </div>
        <div className="list-actions w-full sm:w-auto">
          <button
            type="button"
            className="btn-secondary flex-1 sm:flex-none"
            onClick={() => {
              if (dirty) setConfirm('discard');
              else router.push('/notes');
            }}
          >
            Back
          </button>
          <button
            type="button"
            className="btn-primary flex-1 sm:flex-none"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {existing && (
            <RowOverflowMenu
              items={[{ label: 'Delete…', onClick: () => setConfirm('delete'), danger: true }]}
            />
          )}
        </div>
      </div>

      {confirm === 'delete' && (
        <ConfirmBanner
          danger
          title="Delete this note?"
          message="This permanently removes the note. This cannot be undone."
          confirmLabel="Delete note"
          onConfirm={() => void removeConfirmed()}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'discard' && (
        <ConfirmBanner
          title="Discard unsaved changes?"
          message="You have edits that have not been saved. Leave anyway?"
          confirmLabel="Discard"
          onConfirm={() => {
            setDirty(false);
            setConfirm(null);
            router.push('/notes');
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {formError && (
        <div className="mb-3 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {formError}
        </div>
      )}

      <div className="panel grid gap-4 p-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="Note title"
            value={title}
            onChange={(e) => markDirty(setTitle)(e.target.value)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="label">Category</label>
            <SelectDropdown
              aria-label="Category"
              value={categoryId}
              onChange={markDirty(setCategoryId)}
              options={[
                { value: '', label: 'None' },
                ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color })),
              ]}
            />
          </div>
          <div>
            <label className="label">Tags</label>
            <TagChipInput
              value={tags}
              onChange={markDirty(setTags)}
              suggestions={tagSuggestions}
              placeholder="Add tag…"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className={`mb-0.5 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                favorite
                  ? 'text-[var(--color-favorite)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
              aria-pressed={favorite}
              onClick={() => markDirty(setFavorite)(!favorite)}
            >
              ★ Favorite
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            {mode !== 'preview' ? (
              <MarkdownToolbar
                textareaRef={textareaRef}
                value={content}
                onChange={markDirty(setContent)}
              />
            ) : (
              <span className="text-xs text-[var(--color-muted)]">Preview</span>
            )}
            <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-chip)] p-0.5">
              {(
                [
                  ['edit', 'Edit'],
                  ['split', 'Split'],
                  ['preview', 'Preview'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`min-h-8 rounded-lg px-3 py-1 text-xs font-medium transition ${
                    mode === key
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                  onClick={() => setMode(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'edit' && (
            <MarkdownEditor
              ref={textareaRef}
              value={content}
              onChange={markDirty(setContent)}
              rows={16}
              aria-label="Note content"
            />
          )}
          {mode === 'preview' && (
            <div className="min-h-[320px] rounded-xl border border-[var(--color-border)] p-4">
              <MarkdownPreview content={content} />
            </div>
          )}
          {mode === 'split' && (
            <div className="grid gap-3 md:grid-cols-2">
              <MarkdownEditor
                ref={textareaRef}
                value={content}
                onChange={markDirty(setContent)}
                rows={16}
                className="min-h-[320px] resize-none"
                aria-label="Note content"
              />
              <div className="min-h-[320px] overflow-y-auto rounded-xl border border-[var(--color-border)] p-4">
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {wordCount} word{wordCount === 1 ? '' : 's'} · Markdown · Ctrl S to save
          </p>
        </div>
      </div>
    </div>
  );
}
