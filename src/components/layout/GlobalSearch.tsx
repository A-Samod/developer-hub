'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useHub } from '@/lib/hub/HubProvider';
import type { SearchResult } from '@/types/models';

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  note: 'Note',
  snippet: 'Snippet',
  task: 'Task',
};

export default function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const hub = useHub();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSearchPage = pathname.startsWith('/search');
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (onSearchPage) {
      setQ(searchParams.get('q') ?? '');
    }
  }, [onSearchPage, searchParams]);

  useEffect(() => {
    const trimmed = q.trim();

    if (onSearchPage) {
      const handle = window.setTimeout(() => {
        const next = trimmed
          ? `/search?q=${encodeURIComponent(trimmed)}`
          : '/search';
        const currentQ = searchParams.get('q') ?? '';
        if (trimmed !== currentQ.trim()) {
          router.replace(next);
        }
      }, 200);
      return () => window.clearTimeout(handle);
    }

    if (!trimmed) {
      setResults([]);
      setSearching(false);
      setPanelOpen(false);
      return;
    }

    setSearching(true);
    setPanelOpen(true);
    const handle = window.setTimeout(async () => {
      try {
        const rows = await hub.search(trimmed);
        setResults(rows.slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, onSearchPage]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPanelOpen(false);
        if (compact && !q.trim()) setExpanded(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [compact, q]);

  function openFullSearch() {
    const trimmed = q.trim();
    setPanelOpen(false);
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    else router.push('/search');
  }

  function clearSearch() {
    setQ('');
    setResults([]);
    setPanelOpen(false);
    setSearching(false);
    if (onSearchPage) router.replace('/search');
    if (compact) setExpanded(false);
  }

  const showInput = !compact || expanded || !!q.trim() || onSearchPage;

  const dropdown =
    !onSearchPage && panelOpen && q.trim() ? (
      <div
        id={listId}
        role="listbox"
        className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] shadow-lg"
      >
        {searching && (
          <div className="px-3 py-2 text-sm text-[var(--color-muted)]">Searching…</div>
        )}
        {!searching && results.length === 0 && (
          <div className="px-3 py-2 text-sm text-[var(--color-muted)]">No matches</div>
        )}
        {!searching &&
          results.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.href}
              role="option"
              className="block border-b border-[var(--color-border)] px-3 py-2 last:border-b-0 hover:bg-[var(--color-surface)]"
              onClick={() => {
                setPanelOpen(false);
                setQ('');
                if (compact) setExpanded(false);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="chip">{TYPE_LABEL[item.type]}</span>
                <span className="truncate text-sm font-medium">{item.title}</span>
              </div>
              {item.excerpt && (
                <p className="mt-0.5 line-clamp-1 font-mono text-xs text-[var(--color-muted)]">
                  {item.excerpt}
                </p>
              )}
            </Link>
          ))}
        <button
          type="button"
          className="w-full border-t border-[var(--color-border)] px-3 py-2 text-left text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-surface)]"
          onClick={openFullSearch}
        >
          Open full search results
        </button>
      </div>
    ) : null;

  if (compact && !showInput) {
    return (
      <div className="relative ml-auto" ref={rootRef}>
        <button
          type="button"
          className="btn-secondary min-h-10 min-w-10 px-2"
          aria-label="Search"
          onClick={() => setExpanded(true)}
        >
          ⌕
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative ${compact ? 'ml-auto w-[min(70vw,16rem)]' : 'w-full max-w-xl'}`}
      ref={rootRef}
    >
      <div className="relative">
        <input
          className={
            compact
              ? 'input min-h-10 w-full py-2 pr-10 text-sm'
              : 'input w-full pr-10'
          }
          placeholder={compact ? 'Search…' : 'Search notes, snippets, tasks…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (!onSearchPage && q.trim()) setPanelOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!onSearchPage) openFullSearch();
            }
            if (e.key === 'Escape') {
              if (q) clearSearch();
              else {
                setPanelOpen(false);
                if (compact) setExpanded(false);
              }
            }
          }}
          aria-label="Global search"
          aria-autocomplete="list"
          aria-controls={listId}
          autoFocus={compact && expanded}
        />
        {q && (
          <button
            type="button"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            aria-label="Clear search"
            onClick={clearSearch}
          >
            ✕
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
}
