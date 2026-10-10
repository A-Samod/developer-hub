'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import CodeBlock from '@/components/markdown/CodeBlock';
import CopyCodeButton from '@/components/snippets/CopyCodeButton';
import { useHub } from '@/lib/hub/HubProvider';
import { SNIPPET_LANGUAGES } from '@/types/models';

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
      window.alert('Title is required');
      return;
    }
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
      window.alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    if (!window.confirm('Delete this snippet?')) return;
    await hub.deleteSnippet(existing.id);
    router.push('/snippets');
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {existing ? 'Edit snippet' : 'New snippet'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Plain-text code editor · whitespace preserved
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/snippets"
            className="btn-secondary"
            onClick={(e) => {
              if (dirty && !window.confirm('Discard unsaved changes?')) e.preventDefault();
            }}
          >
            Back
          </Link>
          {existing && (
            <>
              <CopyCodeButton code={code} />
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  const copy = await hub.duplicateSnippet(existing.id);
                  if (copy) router.push(`/snippets/${copy.id}`);
                }}
              >
                Duplicate
              </button>
              <button type="button" className="btn-danger" onClick={remove}>
                Delete
              </button>
            </>
          )}
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

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
            <select
              className="input"
              value={language}
              onChange={(e) => markDirty(setLanguage)(e.target.value)}
            >
              {SNIPPET_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
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
