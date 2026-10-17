'use client';

import { useMemo, useState } from 'react';

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  id?: string;
};

export default function TagChipInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add tag…',
  id,
}: Props) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const existing = new Set(value.map((t) => t.toLowerCase()));
    return suggestions
      .filter((s) => !existing.has(s.toLowerCase()))
      .filter((s) => !q || s.toLowerCase().includes(q))
      .slice(0, 8);
  }, [draft, suggestions, value]);

  function commit(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
    setOpen(false);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="relative">
      <div className="input flex min-h-11 flex-wrap items-center gap-1.5 py-1.5">
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-chip)] px-2 py-0.5 text-xs text-[var(--color-chip-text)]"
          >
            {tag}
            <button
              type="button"
              className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              aria-label={`Remove ${tag}`}
              onClick={() => removeAt(i)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm outline-none"
          value={draft}
          placeholder={value.length === 0 ? placeholder : ''}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit(draft.replace(/,/g, ''));
            }
            if (e.key === 'Backspace' && !draft && value.length) {
              removeAt(value.length - 1);
            }
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg">
          {filtered.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
