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
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        className={theme === 'light' ? 'btn-primary' : 'btn-secondary'}
        onClick={() => choose('light')}
      >
        Light
      </button>
      <button
        type="button"
        className={theme === 'dark' ? 'btn-primary' : 'btn-secondary'}
        onClick={() => choose('dark')}
      >
        Dark
      </button>
    </div>
  );
}
