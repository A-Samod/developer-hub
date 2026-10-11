'use client';

import { useEffect, useState } from 'react';
import { getTheme, setTheme, subscribeTheme, type Theme } from '@/lib/theme';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(getTheme());
    return subscribeTheme(setThemeState);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    setThemeState(next);
  }

  if (compact) {
    return (
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => choose(theme === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === 'dark' ? 'Light theme' : 'Dark theme'}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-chip)] p-1 shadow-sm"
    >
      <button
        type="button"
        className={`min-h-9 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
          theme === 'light'
            ? 'bg-[var(--color-panel)] text-[var(--color-ink)] shadow-sm'
            : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
        }`}
        aria-pressed={theme === 'light'}
        onClick={() => choose('light')}
      >
        Light
      </button>
      <button
        type="button"
        className={`min-h-9 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
          theme === 'dark'
            ? 'bg-[var(--color-panel)] text-[var(--color-ink)] shadow-sm'
            : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
        }`}
        aria-pressed={theme === 'dark'}
        onClick={() => choose('dark')}
      >
        Dark
      </button>
    </div>
  );
}
