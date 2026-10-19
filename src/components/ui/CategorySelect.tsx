'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import ColorSwatchPicker from '@/components/ui/ColorSwatchPicker';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors';
import { useHub } from '@/lib/hub/HubProvider';
import { toastError, toastSuccess } from '@/lib/toast';
import type { CategoryEntityType } from '@/types/models';

const entityLabels: Record<CategoryEntityType, string> = {
  note: 'note',
  snippet: 'snippet',
  task: 'task',
};

type Props = {
  entityType: CategoryEntityType;
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
  'aria-label'?: string;
};

export default function CategorySelect({
  entityType,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Category',
}: Props) {
  const hub = useHub();
  const rootRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const categories = useMemo(
    () => hub.listCategories(entityType),
    [hub, entityType, hub.state.categories],
  );

  const selected = categories.find((c) => c.id === value);
  const options = [
    { value: '', label: 'None', color: undefined as string | undefined },
    ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color })),
  ];

  useEffect(() => {
    if (!open && !createOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setCreateOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (createOpen) {
          setCreateOpen(false);
          return;
        }
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, createOpen]);

  useEffect(() => {
    if (!createOpen) return;
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [createOpen]);

  function openCreate() {
    setOpen(false);
    setFormError('');
    setName('');
    setColor(DEFAULT_CATEGORY_COLOR);
    setCreateOpen(true);
  }

  async function createCategory() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Name is required');
      return;
    }
    const dup = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (dup) {
      setFormError('A category with this name already exists');
      return;
    }
    setFormError('');
    setCreating(true);
    try {
      const category = await hub.createCategory({
        name: trimmed,
        entity_type: entityType,
        color,
      });
      onChange(category.id);
      setCreateOpen(false);
      setName('');
      toastSuccess('Category created');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create category';
      setFormError(msg);
      toastError(msg);
    } finally {
      setCreating(false);
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
        onClick={() => {
          setCreateOpen(false);
          setOpen((v) => !v);
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.color && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: selected.color }}
            />
          )}
          <span className="truncate">{selected?.name ?? 'None'}</span>
        </span>
        <span className="shrink-0 text-[var(--color-muted)]" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg"
        >
          <ul>
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value || '__none'}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                        : 'text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    {opt.color ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: opt.color }}
                        aria-hidden
                      />
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                    {active && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="my-1 border-t border-[var(--color-border)]" />
          <div className="px-1 pb-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
              onClick={openCreate}
            >
              + New category
            </button>
            <Link
              href={`/settings?type=${entityType}`}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              onClick={() => setOpen(false)}
            >
              Manage categories →
            </Link>
          </div>
        </div>
      )}

      {createOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-[min(18.5rem,calc(100vw-2rem))] rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 shadow-lg sm:left-full sm:top-0 sm:ml-2 sm:mt-0"
          role="dialog"
          aria-label={`New ${entityLabels[entityType]} category`}
        >
          <p className="text-sm font-semibold tracking-tight">
            New {entityLabels[entityType]} category
          </p>
          <label className="label mt-3" htmlFor={`${listId}-name`}>
            Name
          </label>
          <input
            id={`${listId}-name`}
            ref={nameInputRef}
            className="input"
            placeholder="e.g. Docker"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFormError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void createCategory();
              }
            }}
          />
          <div className="mt-3">
            <p className="label mb-1.5">Color</p>
            <ColorSwatchPicker value={color} onChange={setColor} size="sm" />
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Added to {entityLabels[entityType]} categories and selected for this{' '}
            {entityLabels[entityType]}.
          </p>
          {formError && (
            <p className="mt-2 text-xs text-[var(--color-danger)]">{formError}</p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary min-h-8 px-3 py-1.5 text-xs"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary min-h-8 px-3 py-1.5 text-xs"
              onClick={() => void createCategory()}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
