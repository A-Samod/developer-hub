'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLogo from '@/components/layout/AppLogo';
import Sidebar from '@/components/layout/Sidebar';

function currentFromPath(pathname: string): string {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/notes')) return 'notes';
  if (pathname.startsWith('/snippets')) return 'snippets';
  if (pathname.startsWith('/todos')) return 'todos';
  if (pathname.startsWith('/tasks')) return 'tasks';
  if (pathname.startsWith('/search')) return 'search';
  if (pathname.startsWith('/settings')) return 'settings';
  return '';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = currentFromPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close the mobile drawer if the viewport becomes desktop-sized
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop / web: permanent sidebar — no collapse control */}
      <div className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:shrink-0">
        <Sidebar current={current} />
      </div>

      {/* Mobile / tablet only: slide-out drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out lg:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        <Sidebar
          current={current}
          mobile
          onClose={() => setMenuOpen(false)}
          onNavigate={() => setMenuOpen(false)}
        />
      </div>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet top bar only — not shown on web desktop */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-3 lg:hidden">
          <button
            type="button"
            className="btn-secondary min-h-10 min-w-10 px-2"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span className="flex flex-col gap-1" aria-hidden>
              <span className="block h-0.5 w-4 bg-current" />
              <span className="block h-0.5 w-4 bg-current" />
              <span className="block h-0.5 w-4 bg-current" />
            </span>
          </button>
          <AppLogo className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight">Developer Hub</div>
            <div className="truncate text-xs text-[var(--color-muted)] capitalize">
              {current === 'dashboard' ? 'Dashboard' : current.replace('_', ' ')}
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
