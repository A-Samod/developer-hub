export type Theme = 'light' | 'dark';

export const THEME_KEY = 'developer-hub.theme';

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(THEME_KEY);
  return raw === 'dark' || raw === 'light' ? raw : null;
}

export function getTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('developer-hub:theme', { detail: theme }));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function subscribeTheme(listener: (theme: Theme) => void): () => void {
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<Theme>).detail;
    listener(detail ?? getTheme());
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) listener(getTheme());
  };
  window.addEventListener('developer-hub:theme', onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('developer-hub:theme', onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
