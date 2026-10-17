'use client';

import { useEffect, useState } from 'react';
import {
  getResolvedTheme,
  getTheme,
  setTheme,
  subscribeTheme,
  toggleTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function MoonIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Compact sidebar control: toggles Light ↔ Dark based on resolved theme. */
export function ThemeIconButton() {
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  useEffect(() => {
    setResolved(getResolvedTheme());
    return subscribeTheme(() => setResolved(getResolvedTheme()));
  }, []);

  const isDark = resolved === 'dark';

  return (
    <button
      type="button"
      className="btn-secondary inline-flex h-10 w-10 shrink-0 items-center justify-center px-0"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => {
        toggleTheme();
        setResolved(getResolvedTheme());
      }}
    >
      {/* Show the target theme: sun in dark mode, moon in light mode */}
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');

  useEffect(() => {
    setThemeState(getTheme());
    return subscribeTheme(setThemeState);
  }, []);

  function choose(next: ThemePreference) {
    setTheme(next);
    setThemeState(next);
  }

  if (compact) {
    return <ThemeIconButton />;
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-chip)] p-1 shadow-sm"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`min-h-9 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
            theme === opt.value
              ? 'bg-[var(--color-accent)] text-white shadow-sm'
              : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
          }`}
          aria-pressed={theme === opt.value}
          onClick={() => choose(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
