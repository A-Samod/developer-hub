'use client';

import { CATEGORY_COLORS } from '@/lib/categoryColors';

type Props = {
  value: string;
  onChange: (color: string) => void;
  size?: 'sm' | 'md';
};

function isPreset(color: string) {
  const normalized = color.trim().toLowerCase();
  return (CATEGORY_COLORS as readonly string[]).some((c) => c.toLowerCase() === normalized);
}

export default function ColorSwatchPicker({ value, onChange, size = 'md' }: Props) {
  const dim = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const customSelected = !isPreset(value);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Category color">
      {CATEGORY_COLORS.map((c) => {
        const selected = value.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            aria-pressed={selected}
            className={`${dim} rounded-full border-2 transition ${
              selected
                ? 'scale-110 border-[var(--color-ink)]'
                : 'border-transparent opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
          />
        );
      })}
      <label
        className={`relative ${dim} shrink-0 cursor-pointer rounded-full border-2 transition ${
          customSelected
            ? 'scale-110 border-[var(--color-ink)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
        }`}
        title="Custom color"
        aria-label="Custom color"
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: customSelected
              ? value
              : 'conic-gradient(from 180deg, #f97316, #ec4899, #8b5cf6, #0ea5e9, #14b8a6, #84cc16, #f97316)',
          }}
          aria-hidden
        />
        {!customSelected && (
          <span
            className="absolute inset-[3px] rounded-full bg-[var(--color-panel)]"
            aria-hidden
          />
        )}
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[var(--color-ink)]"
          aria-hidden
        >
          {customSelected ? '' : '+'}
        </span>
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#0ea5e9'}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
