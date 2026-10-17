export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** @deprecated Use ThemePreference — kept as alias for gradual migration */
export type Theme = ThemePreference;

export const THEME_KEY = 'developer-hub.theme';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): ThemePreference | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(THEME_KEY);
  if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
  return null;
}

export function getTheme(): ThemePreference {
  return getStoredTheme() ?? 'system';
}

export function getResolvedTheme(): ResolvedTheme {
  const pref = getTheme();
  if (pref === 'system') return getSystemTheme();
  return pref;
}

export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
}

export function setTheme(preference: ThemePreference): void {
  localStorage.setItem(THEME_KEY, preference);
  applyTheme(preference === 'system' ? getSystemTheme() : preference);
  window.dispatchEvent(new CustomEvent('developer-hub:theme', { detail: preference }));
}

export function toggleTheme(): ThemePreference {
  const resolved = getResolvedTheme();
  const next: ThemePreference = resolved === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function subscribeTheme(listener: (preference: ThemePreference) => void): () => void {
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<ThemePreference>).detail;
    listener(detail ?? getTheme());
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) listener(getTheme());
  };
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onMq = () => {
    if (getTheme() === 'system') {
      applyTheme(getSystemTheme());
      listener('system');
    }
  };
  window.addEventListener('developer-hub:theme', onCustom);
  window.addEventListener('storage', onStorage);
  mq.addEventListener('change', onMq);
  return () => {
    window.removeEventListener('developer-hub:theme', onCustom);
    window.removeEventListener('storage', onStorage);
    mq.removeEventListener('change', onMq);
  };
}
