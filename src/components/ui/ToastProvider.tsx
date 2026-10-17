'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { getResolvedTheme, subscribeTheme } from '@/lib/theme';

export default function ToastProvider() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTheme(getResolvedTheme());
    return subscribeTheme(() => setTheme(getResolvedTheme()));
  }, []);

  return (
    <Toaster
      theme={theme}
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            'border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-ink)] shadow-lg',
          actionButton: 'bg-[var(--color-accent)] text-white!',
        },
      }}
    />
  );
}
