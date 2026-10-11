'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { formatDateTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import type { SearchResult } from '@/types/models';

const typeOrder = ['note', 'snippet', 'task'] as const;
const typeLabels: Record<(typeof typeOrder)[number], string> = {
  note: 'Notes',
  snippet: 'Snippets',
  task: 'Tasks',
};

export default function SearchPage() {
  const hub = useHub();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setError('');
      setSearching(false);
      return;
    }
    const handle = window.setTimeout(async () => {
      setSearching(true);
      setError('');
      try {
        const rows = await hub.search(q);
        setResults(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const grouped = useMemo(() => {
    const map: Record<string, SearchResult[]> = {
      note: [],
      snippet: [],
      task: [],
    };
    for (const r of results) {
      if (r.type in map) map[r.type].push(r);
    }
    return map;
  }, [results]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Use the search bar above. Results update as you type.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {!query.trim() && (
        <div className="panel px-5 py-8 text-sm text-[var(--color-muted)]">
          Type in the header search to find notes, snippets, and tasks.
        </div>
      )}

      {query.trim() && searching && (
        <p className="mb-4 text-sm text-[var(--color-muted)]">Searching…</p>
      )}

      {query.trim() && !searching && results.length === 0 && !error && (
        <div className="panel px-5 py-8 text-center">
          <p className="font-medium">No matches for “{query.trim()}”</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Try a shorter fragment or different keyword.
          </p>
        </div>
      )}

      {typeOrder.map((type) => {
        const items = grouped[type];
        if (!items.length) return null;
        return (
          <section key={type} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {typeLabels[type]} ({items.length})
            </h2>
            <ul className="panel divide-y divide-[var(--color-border)]">
              {items.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="block px-4 py-3 hover:bg-[var(--color-surface)]"
                  >
                    <div className="font-medium">{item.title}</div>
                    <p className="mt-1 line-clamp-2 font-mono text-xs text-[var(--color-muted)]">
                      {item.excerpt}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                      {item.category_name && <span>{item.category_name}</span>}
                      {item.tags?.slice(0, 3).map((t) => (
                        <span key={t} className="chip">
                          {t}
                        </span>
                      ))}
                      <span>Updated {formatDateTime(item.updated_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
