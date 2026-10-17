'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { SelectOption } from '@/components/ui/SelectDropdown';

type Props = {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
};

export default function MultiSelectDropdown({
  values,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  'aria-label': ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedLabels = options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label);

  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels.length} selected`;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className="input flex w-full items-center justify-between gap-2 text-left"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{summary}</span>
        <span className="shrink-0 text-[var(--color-muted)]" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg"
        >
          {options.map((opt) => {
            const checked = values.includes(opt.value);
            return (
              <li key={opt.value} role="option" aria-selected={checked}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)] ${
                    checked ? 'bg-[var(--color-accent-soft)]' : ''
                  }`}
                  onClick={() => toggle(opt.value)}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    tabIndex={-1}
                    className="pointer-events-none"
                    aria-hidden
                  />
                  {opt.color && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: opt.color }}
                    />
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
