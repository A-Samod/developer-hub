'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type ResourceOption = {
  key: string;
  label: string;
  href: string;
  typeLabel: string;
};

type Props = {
  options: ResourceOption[];
  value: string[];
  onChange: (keys: string[]) => void;
  placeholder?: string;
};

export default function ResourceMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Search notes and snippets…',
}: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  const selected = useMemo(
    () => value.map((k) => options.find((o) => o.key === k)).filter(Boolean) as ResourceOption[],
    [value, options],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedSet = new Set(value);
    return options
      .filter((o) => !selectedSet.has(o.key))
      .filter((o) => !q || o.label.toLowerCase().includes(q) || o.typeLabel.toLowerCase().includes(q))
      .slice(0, 12);
  }, [options, query, value]);

  useEffect(() => {
    if (!linkOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setLinkOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [linkOpen]);

  function add(key: string) {
    if (value.includes(key)) return;
    onChange([...value, key]);
    setQuery('');
    setLinkOpen(false);
  }

  function remove(key: string) {
    onChange(value.filter((k) => k !== key));
  }

  return (
    <div ref={rootRef} className="flex flex-wrap items-center gap-2">
      {selected.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-chip)] px-2.5 py-1 text-xs"
        >
          <span className="text-[var(--color-muted)]">{item.typeLabel}</span>
          <Link
            href={item.href}
            className="font-medium text-[var(--color-accent)] hover:underline"
          >
            {item.label}
          </Link>
          <button
            type="button"
            className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            aria-label={`Remove ${item.label}`}
            onClick={() => remove(item.key)}
          >
            ×
          </button>
        </span>
      ))}

      <div className="relative">
        <button
          type="button"
          className="btn-secondary min-h-8 px-3 py-1.5 text-xs text-[var(--color-accent)]"
          onClick={() => setLinkOpen((v) => !v)}
        >
          + Link
        </button>
        {linkOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-[min(20rem,80vw)] rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-2 shadow-lg">
            <label className="sr-only" htmlFor={inputId}>
              {placeholder}
            </label>
            <input
              id={inputId}
              className="input"
              autoFocus
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="mt-1 max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-2 py-2 text-sm text-[var(--color-muted)]">No matches</li>
              ) : (
                filtered.map((o) => (
                  <li key={o.key}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--color-surface)]"
                      onClick={() => add(o.key)}
                    >
                      <span className="truncate font-medium">{o.label}</span>
                      <span className="shrink-0 text-xs text-[var(--color-muted)]">
                        {o.typeLabel}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
