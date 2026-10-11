'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { TagChip } from '@/components/tasks/StatusBadge';
import { formatDateTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';

type SortKey = 'updated' | 'title';

export default function NotesPage() {
  const hub = useHub();
  const categories = useMemo(() => hub.listCategories('note'), [hub]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('updated');

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

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading notes…</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
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

      {notes.length === 0 ? (
        <div className="panel px-5 py-10 text-center">
          <p className="font-medium">No notes match</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Try clearing filters or create a new note.
          </p>
          <Link href="/notes/new" className="btn-primary mt-4 inline-flex">
            New note
          </Link>
        </div>
      ) : (
        <ul className="panel divide-y divide-[var(--color-border)]">
          {notes.map((note) => {
            const cat = categories.find((c) => c.id === note.category_id);
            return (
              <li key={note.id} className="list-row">
                <Link href={`/notes/${note.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{note.title}</span>
                    {note.is_favorite && (
                      <span className="text-xs text-[var(--color-favorite)]">Favorite</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                    {cat && (
                      <span style={{ color: cat.color }} className="font-medium">
                        {cat.name}
                      </span>
                    )}
                    <span>Updated {formatDateTime(note.updated_at)}</span>
                    {note.tags.slice(0, 3).map((t) => (
                      <TagChip key={t} tag={t} />
                    ))}
                    {note.tags.length > 3 && <span>+{note.tags.length - 3}</span>}
                  </div>
                </Link>
                <div className="list-actions">
                  <button
                    type="button"
                    className="btn-danger w-full sm:w-auto"
                    onClick={async () => {
                      if (window.confirm('Delete this note?')) await hub.deleteNote(note.id);
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
