'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import CopyCodeButton from '@/components/snippets/CopyCodeButton';
import { TagChip } from '@/components/tasks/StatusBadge';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import ListPagination from '@/components/ui/ListPagination';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { formatDateTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { useListPagination } from '@/lib/useListPagination';
import { formatSnippetLanguage, SNIPPET_LANGUAGES } from '@/types/models';

type SortKey = 'updated' | 'title';

export default function SnippetsPage() {
  const hub = useHub();
  const categories = useMemo(() => hub.listCategories('snippet'), [hub]);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('updated');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

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

  const filterKey = `${query}|${language}|${categoryId}|${favoritesOnly}|${sort}`;
  const {
    pageSize,
    setPageSize,
    currentPage,
    setPage,
    totalPages,
    pageStart,
    pageEnd,
    pagedItems: pagedSnippets,
    total,
  } = useListPagination(snippets, filterKey);

  function startRename(id: string, title: string) {
    setRenameId(id);
    setRenameValue(title);
  }

  async function saveRename() {
    if (!renameId || !renameValue.trim()) return;
    await hub.updateSnippet(renameId, { title: renameValue.trim() });
    setRenameId(null);
    setRenameValue('');
  }

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
        <SelectDropdown
          aria-label="Language"
          value={language}
          onChange={setLanguage}
          options={[
            { value: '', label: 'All languages' },
            ...SNIPPET_LANGUAGES.map((lang) => ({
              value: lang,
              label: formatSnippetLanguage(lang),
            })),
          ]}
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
          aria-label="Sort"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={[
            { value: 'updated', label: 'Recently updated' },
            { value: 'title', label: 'Title A–Z' },
          ]}
        />
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
          Favorites only
        </label>
      </div>

      {deleteId && (
        <ConfirmBanner
          danger
          title="Delete this snippet?"
          message="This permanently removes the snippet. This cannot be undone."
          confirmLabel="Delete snippet"
          onConfirm={async () => {
            await hub.deleteSnippet(deleteId);
            setDeleteId(null);
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {snippets.length === 0 ? (
        <div className="panel px-5 py-10 text-center">
          <p className="font-medium">No snippets match</p>
          <Link href="/snippets/new" className="btn-primary mt-4 inline-flex">
            New snippet
          </Link>
        </div>
      ) : (
        <>
          <ul className="panel divide-y divide-[var(--color-border)]">
            {pagedSnippets.map((snippet) => {
              const cat = categories.find((c) => c.id === snippet.category_id);
              const renaming = renameId === snippet.id;
              return (
                <li key={snippet.id} className="list-row">
                  <div className="min-w-0 flex-1">
                    {renaming ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="input max-w-md flex-1"
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void saveRename();
                            if (e.key === 'Escape') {
                              setRenameId(null);
                              setRenameValue('');
                            }
                          }}
                          aria-label="Snippet title"
                        />
                        <button
                          type="button"
                          className="btn-primary w-full sm:w-auto"
                          onClick={() => void saveRename()}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-secondary w-full sm:w-auto"
                          onClick={() => {
                            setRenameId(null);
                            setRenameValue('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <Link href={`/snippets/${snippet.id}`} className="block min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{snippet.title}</span>
                          <span className="chip">{formatSnippetLanguage(snippet.language)}</span>
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
                    )}
                  </div>
                  {!renaming && (
                    <div className="list-actions">
                      <CopyCodeButton code={snippet.code} className="w-full sm:w-auto" />
                      <button
                        type="button"
                        className="btn-secondary w-full sm:w-auto"
                        onClick={() => startRename(snippet.id, snippet.title)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="btn-danger w-full sm:w-auto"
                        onClick={() => setDeleteId(snippet.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
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
            perPageLabel="Snippets per page"
          />
        </>
      )}
    </div>
  );
}
