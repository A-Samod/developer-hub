'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatDateTime } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import type { SearchResult } from '@/types/models';

const typeOrder = ['note', 'snippet', 'task', 'todo'] as const;
const typeLabels: Record<(typeof typeOrder)[number], string> = {
  note: 'Notes',
  snippet: 'Snippets',
  task: 'Tasks',
  todo: 'To-dos',
};

export default function SearchPage() {
  const hub = useHub();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setError('');
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
    }, 250);
    return () => window.clearTimeout(handle);
    // Intentionally only re-run on query changes; hub.search reads latest client/session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const grouped = useMemo(() => {
    const map: Record<string, SearchResult[]> = {
      note: [],
      snippet: [],
      task: [],
      todo: [],
    };
    for (const r of results) map[r.type].push(r);
    return map;
  }, [results]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Postgres full-text + substring search across notes, snippets, tasks, and to-dos
        </p>
      </div>

      <input
        className="input mb-4 text-base"
        autoFocus
        placeholder="Try git rebase, CORS, passport, main(input)…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          const url = new URL(window.location.href);
          if (e.target.value.trim()) url.searchParams.set('q', e.target.value);
          else url.searchParams.delete('q');
          window.history.replaceState({}, '', url);
        }}
      />

      {error && (
        <div className="mb-4 rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {!query.trim() && (
        <div className="panel px-5 py-8 text-sm text-[var(--color-muted)]">
          Enter a phrase to search titles, bodies, tags, and code.
        </div>
      )}

      {query.trim() && searching && (
        <p className="mb-4 text-sm text-[var(--color-muted)]">Searching…</p>
      )}

      {query.trim() && !searching && results.length === 0 && !error && (
        <div className="panel px-5 py-8 text-center">
          <p className="font-medium">No matches</p>
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
