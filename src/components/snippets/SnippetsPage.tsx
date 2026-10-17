'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import SnippetCard from '@/components/snippets/SnippetCard';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import LoadMoreButton from '@/components/ui/LoadMoreButton';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { useHub } from '@/lib/hub/HubProvider';
import { toastSuccess, toastUndo } from '@/lib/toast';
import { useLoadMore } from '@/lib/useLoadMore';
import { formatSnippetLanguage, SNIPPET_LANGUAGES } from '@/types/models';

type SortKey = 'updated' | 'title';

export default function SnippetsPage() {
  const hub = useHub();
  const categories = useMemo(
    () => hub.state.categories.filter((c) => c.entity_type === 'snippet'),
    [hub.state.categories],
  );
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('updated');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const hasFilters = Boolean(query.trim() || language || categoryId || favoritesOnly);

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
    visibleItems: visibleSnippets,
    hasMore,
    remaining,
    loadMore,
    total,
    visibleCount,
  } = useLoadMore(snippets, filterKey);

  async function confirmDelete() {
    if (!deleteId) return;
    const snapshot = hub.getSnippet(deleteId);
    await hub.deleteSnippet(deleteId);
    setDeleteId(null);
    if (!snapshot) return;
    toastUndo('Snippet deleted', async () => {
      await hub.createSnippet({
        title: snapshot.title,
        description: snapshot.description,
        language: snapshot.language,
        code: snapshot.code,
        category_id: snapshot.category_id,
        tags: [...snapshot.tags],
        is_favorite: snapshot.is_favorite,
      });
      toastSuccess('Snippet restored');
    });
  }

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading snippets…</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Snippets</h1>
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
        <button
          type="button"
          className={favoritesOnly ? 'btn-primary' : 'btn-secondary'}
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          ★ Favorites
        </button>
      </div>

      {deleteId && (
        <ConfirmBanner
          danger
          title="Delete this snippet?"
          message="This permanently removes the snippet. You can Undo from the toast for a short time."
          confirmLabel="Delete snippet"
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {hub.state.snippets.length === 0 ? (
        <div className="panel px-5 py-10 text-center">
          <p className="font-medium">No snippets yet</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Save your first command or code block.
          </p>
          <Link href="/snippets/new" className="btn-primary mt-4 inline-flex">
            New snippet
          </Link>
        </div>
      ) : snippets.length === 0 && hasFilters ? (
        <div className="panel px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No snippets match your filters
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleSnippets.map((snippet) => {
              const cat = categories.find((c) => c.id === snippet.category_id);
              return (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  category={cat}
                  onToggleFavorite={() =>
                    void hub.updateSnippet(snippet.id, { is_favorite: !snippet.is_favorite })
                  }
                  onDuplicate={async () => {
                    const copy = await hub.duplicateSnippet(snippet.id);
                    if (copy) toastSuccess('Snippet duplicated');
                  }}
                  onDelete={() => setDeleteId(snippet.id)}
                />
              );
            })}
          </div>
          <LoadMoreButton
            hasMore={hasMore}
            remaining={remaining}
            total={total}
            visibleCount={visibleCount}
            onLoadMore={loadMore}
            itemLabel="snippets"
          />
        </>
      )}
    </div>
  );
}
