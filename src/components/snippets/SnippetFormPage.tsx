'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import CodeBlock from '@/components/markdown/CodeBlock';
import CopyCodeButton from '@/components/snippets/CopyCodeButton';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { useHub } from '@/lib/hub/HubProvider';
import { formatSnippetLanguage, SNIPPET_LANGUAGES } from '@/types/models';

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function SnippetFormPage({ snippetId }: { snippetId?: string }) {
  const hub = useHub();
  const router = useRouter();
  const existing = snippetId ? hub.getSnippet(snippetId) : undefined;
  const categories = useMemo(() => hub.listCategories('snippet'), [hub]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [language, setLanguage] = useState(existing?.language ?? 'javascript');
  const [code, setCode] = useState(existing?.code ?? '');
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '');
  const [tags, setTags] = useState((existing?.tags ?? []).join(', '));
  const [favorite, setFavorite] = useState(existing?.is_favorite ?? false);
  const [dirty, setDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
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
      setSavedMsg('');
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
        tags: parseTags(tags),
        is_favorite: favorite,
      };
      if (existing) {
        await hub.updateSnippet(existing.id, payload);
        setDirty(false);
        setSavedMsg('Saved');
      } else {
        const snippet = await hub.createSnippet(payload);
        setDirty(false);
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {existing ? 'Edit snippet' : 'New snippet'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Plain-text code editor · whitespace preserved
          </p>
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
          {existing && (
            <>
              <CopyCodeButton code={code} />
              <button
                type="button"
                className="btn-secondary flex-1 sm:flex-none"
                onClick={async () => {
                  const copy = await hub.duplicateSnippet(existing.id);
                  if (copy) router.push(`/snippets/${copy.id}`);
                }}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="btn-danger flex-1 sm:flex-none"
                onClick={() => setConfirm('delete')}
              >
                Delete
              </button>
            </>
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

      {confirm === 'delete' && (
        <ConfirmBanner
          danger
          title="Delete this snippet?"
          message="This permanently removes the snippet. This cannot be undone."
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
      {savedMsg && <div className="mb-3 alert-success">{savedMsg}</div>}

      <div className="panel grid gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
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
            value={description}
            onChange={(e) => markDirty(setDescription)(e.target.value)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
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
        <div>
          <label className="label">Code</label>
          <textarea
            className="input min-h-[240px] font-mono whitespace-pre"
            spellCheck={false}
            value={code}
            onChange={(e) => markDirty(setCode)(e.target.value)}
          />
        </div>
        {code && (
          <div>
            <label className="label">Preview</label>
            <CodeBlock code={code} language={language} />
          </div>
        )}
      </div>
    </div>
  );
}
