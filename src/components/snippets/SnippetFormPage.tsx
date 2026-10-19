'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import CodeEditor from '@/components/snippets/CodeEditor';
import CopyCodeButton from '@/components/snippets/CopyCodeButton';
import CategorySelect from '@/components/ui/CategorySelect';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import RowOverflowMenu from '@/components/ui/RowOverflowMenu';
import SelectDropdown from '@/components/ui/SelectDropdown';
import TagChipInput from '@/components/ui/TagChipInput';
import { formatRelativeTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { toastSuccess } from '@/lib/toast';
import { formatSnippetLanguage, SNIPPET_LANGUAGES } from '@/types/models';

export default function SnippetFormPage({ snippetId }: { snippetId?: string }) {
  const hub = useHub();
  const router = useRouter();
  const existing = snippetId ? hub.getSnippet(snippetId) : undefined;
  const tagSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const s of hub.state.snippets) for (const t of s.tags) set.add(t);
    for (const n of hub.state.notes) for (const t of n.tags) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [hub.state.snippets, hub.state.notes]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [language, setLanguage] = useState(existing?.language ?? 'javascript');
  const [code, setCode] = useState(existing?.code ?? '');
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [favorite, setFavorite] = useState(existing?.is_favorite ?? false);
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<'delete' | 'discard' | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description);
    setLanguage(existing.language);
    setCode(existing.code);
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

  const lineCount = code.length === 0 ? 0 : code.split('\n').length;

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  if (snippetId && !existing) {
    return (
      <div className="panel px-5 py-8">
        <p className="font-medium">Snippet not found</p>
        <Link href="/snippets" className="btn-secondary mt-4 inline-flex">
          Back to snippets
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
        description,
        language,
        code,
        category_id: categoryId || null,
        tags,
        is_favorite: favorite,
      };
      if (existing) {
        await hub.updateSnippet(existing.id, payload);
        setDirty(false);
        setJustSaved(true);
        toastSuccess('Saved');
      } else {
        const snippet = await hub.createSnippet(payload);
        setDirty(false);
        setJustSaved(true);
        toastSuccess('Saved');
        router.replace(`/snippets/${snippet.id}`);
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function removeConfirmed() {
    if (!existing) return;
    await hub.deleteSnippet(existing.id);
    router.push('/snippets');
  }

  async function duplicate() {
    if (!existing) return;
    const copy = await hub.duplicateSnippet(existing.id);
    if (copy) {
      toastSuccess('Snippet duplicated');
      router.push(`/snippets/${copy.id}`);
    }
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
            {existing ? 'Edit snippet' : 'New snippet'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{statusLine()}</p>
        </div>
        <div className="list-actions w-full sm:w-auto">
          <button
            type="button"
            className="btn-secondary flex-1 sm:flex-none"
            onClick={() => {
              if (dirty) setConfirm('discard');
              else router.push('/snippets');
            }}
          >
            Back
          </button>
          <CopyCodeButton code={code} label="Copy code" className="flex-1 sm:flex-none" />
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
              items={[
                { label: 'Duplicate', onClick: () => void duplicate() },
                { label: 'Delete…', onClick: () => setConfirm('delete'), danger: true },
              ]}
            />
          )}
        </div>
      </div>

      {confirm === 'delete' && (
        <ConfirmBanner
          danger
          title="Delete this snippet?"
          message="This permanently removes the snippet."
          confirmLabel="Delete snippet"
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
            router.push('/snippets');
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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="e.g. Hard reset branch"
              value={title}
              onChange={(e) => markDirty(setTitle)(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Language</label>
            <SelectDropdown
              aria-label="Language"
              value={language}
              onChange={markDirty(setLanguage)}
              options={SNIPPET_LANGUAGES.map((lang) => ({
                value: lang,
                label: formatSnippetLanguage(lang),
              }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            placeholder="Short note about when to use this"
            value={description}
            onChange={(e) => markDirty(setDescription)(e.target.value)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="label">Category</label>
            <CategorySelect
              entityType="snippet"
              value={categoryId}
              onChange={markDirty(setCategoryId)}
            />
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              Use topics like Git or Docker. Language is set separately.
            </p>
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
          <label className="label">Code</label>
          <CodeEditor
            value={code}
            onChange={markDirty(setCode)}
            language={language}
            minHeight="320px"
          />
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {formatSnippetLanguage(language)} · {lineCount} line{lineCount === 1 ? '' : 's'} · Tab
            indents · Ctrl S to save
          </p>
        </div>
      </div>
    </div>
  );
}
