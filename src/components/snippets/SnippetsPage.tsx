'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { TagChip } from '@/components/tasks/StatusBadge';
import { formatDateTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { SNIPPET_LANGUAGES } from '@/types/models';

type SortKey = 'updated' | 'title';

export default function SnippetsPage() {
  const hub = useHub();
  const router = useRouter();
  const categories = useMemo(() => hub.listCategories('snippet'), [hub]);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('updated');

  const snippets = useMemo(() => {
    let items = [...hub.state.snippets];
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (language) items = items.filter((s) => s.language === language);
    if (categoryId) items = items.filter((s) => s.category_id === categoryId);
    if (favoritesOnly) items = items.filter((s) => s.is_favorite);
    items.sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : b.updated_at.localeCompare(a.updated_at),
    );
    return items;
  }, [hub.state.snippets, query, language, categoryId, favoritesOnly, sort]);

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading snippets…</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Code Snippets</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Reusable commands and code with one-click copy
          </p>
        </div>
        <Link href="/snippets/new" className="btn-primary w-full sm:w-auto">
          New snippet
        </Link>
      </div>

      <div className="filter-bar">
        <input
          className="input"
          placeholder="Search snippets…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">All languages</option>
          {SNIPPET_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <select
          className="input"
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
          className="input"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="updated">Recently updated</option>
          <option value="title">Title A–Z</option>
        </select>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
          Favorites only
        </label>
      </div>

      {snippets.length === 0 ? (
        <div className="panel px-5 py-10 text-center">
          <p className="font-medium">No snippets match</p>
          <Link href="/snippets/new" className="btn-primary mt-4 inline-flex">
            New snippet
          </Link>
        </div>
      ) : (
        <ul className="panel divide-y divide-[var(--color-border)]">
          {snippets.map((snippet) => {
            const cat = categories.find((c) => c.id === snippet.category_id);
            return (
              <li key={snippet.id} className="list-row">
                <Link href={`/snippets/${snippet.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{snippet.title}</span>
                    <span className="chip">{snippet.language}</span>
                    {snippet.is_favorite && (
                      <span className="text-xs text-[var(--color-favorite)]">Favorite</span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--color-muted)]">
                    {snippet.description}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                    {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                    <span>Updated {formatDateTime(snippet.updated_at)}</span>
                    {snippet.tags.map((t) => (
                      <TagChip key={t} tag={t} />
                    ))}
                  </div>
                </Link>
                <div className="list-actions">
                  <button
                    type="button"
                    className="btn-secondary flex-1 sm:flex-none"
                    onClick={async () => {
                      const copy = await hub.duplicateSnippet(snippet.id);
                      if (copy) router.push(`/snippets/${copy.id}`);
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="btn-danger flex-1 sm:flex-none"
                    onClick={async () => {
                      if (window.confirm('Delete this snippet?')) {
                        await hub.deleteSnippet(snippet.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
