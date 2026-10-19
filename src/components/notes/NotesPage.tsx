'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { TagChip } from '@/components/tasks/StatusBadge';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import LoadMoreButton from '@/components/ui/LoadMoreButton';
import RowOverflowMenu from '@/components/ui/RowOverflowMenu';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { formatRelativeTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { stripMarkdownPreview } from '@/lib/textPreview';
import { toastSuccess, toastUndo } from '@/lib/toast';
import { useLoadMore } from '@/lib/useLoadMore';

type SortKey = 'updated' | 'title';

export default function NotesPage() {
  const hub = useHub();
  const categories = useMemo(() => hub.listCategories('note'), [hub, hub.state.categories]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('updated');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const hasFilters = Boolean(query.trim() || categoryId || favoritesOnly);

  const notes = useMemo(() => {
    let items = [...hub.state.notes];
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content_md.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (categoryId) items = items.filter((n) => n.category_id === categoryId);
    if (favoritesOnly) items = items.filter((n) => n.is_favorite);
    items.sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : b.updated_at.localeCompare(a.updated_at),
    );
    return items;
  }, [hub.state.notes, query, categoryId, favoritesOnly, sort]);

  const filterKey = `${query}|${categoryId}|${favoritesOnly}|${sort}`;
  const { visibleItems: visibleNotes, hasMore, remaining, loadMore, total, visibleCount } =
    useLoadMore(notes, filterKey);

  async function confirmDelete() {
    if (!deleteId) return;
    const snapshot = hub.getNote(deleteId);
    await hub.deleteNote(deleteId);
    setDeleteId(null);
    if (!snapshot) return;
    toastUndo('Note deleted', async () => {
      await hub.createNote({
        title: snapshot.title,
        content_md: snapshot.content_md,
        category_id: snapshot.category_id,
        tags: [...snapshot.tags],
        is_favorite: snapshot.is_favorite,
      });
      toastSuccess('Note restored');
    });
  }

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading notes…</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Technical notes and Markdown documentation
          </p>
        </div>
        <Link href="/notes/new" className="btn-primary w-full sm:w-auto">
          New note
        </Link>
      </div>

      <div className="filter-bar">
        <input
          className="input"
          placeholder="Search notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          title="Delete this note?"
          message="This permanently removes the note. You can Undo from the toast for a short time."
          confirmLabel="Delete note"
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {hub.state.notes.length === 0 ? (
        <div className="panel px-5 py-10 text-center">
          <p className="font-medium">No notes yet</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Create your first technical note.
          </p>
          <Link href="/notes/new" className="btn-primary mt-4 inline-flex">
            New note
          </Link>
        </div>
      ) : notes.length === 0 && hasFilters ? (
        <div className="panel px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No notes match your filters
        </div>
      ) : (
        <>
          <ul className="panel divide-y divide-[var(--color-border)]">
            {visibleNotes.map((note) => {
              const cat = categories.find((c) => c.id === note.category_id);
              const preview = note.content_md ? stripMarkdownPreview(note.content_md) : '';
              return (
                <li
                  key={note.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface)]"
                >
                  <Link href={`/notes/${note.id}`} className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-medium">{note.title}</span>
                      {note.is_favorite && (
                        <span
                          className="shrink-0 text-sm leading-none text-[var(--color-favorite)]"
                          aria-label="Favorite"
                        >
                          ★
                        </span>
                      )}
                    </div>
                    {preview ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--color-muted)] opacity-75">
                        {preview}
                      </p>
                    ) : null}
                    {(cat || note.tags.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {cat && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-chip)] px-2 py-0.5 text-xs font-medium text-[var(--color-chip-text)]">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: cat.color }}
                              aria-hidden
                            />
                            {cat.name}
                          </span>
                        )}
                        {note.tags.slice(0, 3).map((t) => (
                          <TagChip key={t} tag={t} />
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-[var(--color-muted)]">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                  <div className="flex shrink-0 items-start gap-2 pt-0.5">
                    <span className="whitespace-nowrap text-xs text-[var(--color-muted)]">
                      {formatRelativeTime(note.updated_at)}
                    </span>
                    <RowOverflowMenu
                      items={[
                        { label: 'Edit', href: `/notes/${note.id}` },
                        { label: 'Delete…', onClick: () => setDeleteId(note.id), danger: true },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <LoadMoreButton
            hasMore={hasMore}
            remaining={remaining}
            total={total}
            visibleCount={visibleCount}
            onLoadMore={loadMore}
            itemLabel="notes"
          />
        </>
      )}
    </div>
  );
}
