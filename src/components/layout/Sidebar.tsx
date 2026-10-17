'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import AppLogo from '@/components/layout/AppLogo';
import { ThemeIconButton } from '@/components/layout/ThemeToggle';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import { useHub } from '@/lib/hub/HubProvider';
import { createClient } from '@/lib/supabase/client';

function NavIcon({ name }: { name: string }) {
  const common = 'h-4 w-4 shrink-0';
  const icons: Record<string, ReactNode> = {
    dashboard: (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tasks: (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
    notes: (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
    snippets: (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 8 4.5 12 8 16M16 8l3.5 4L16 16M13 5l-2 14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    settings: (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.86 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}

const links = [
  { href: '/', label: 'Home', key: 'dashboard' },
  { href: '/tasks', label: 'Tasks', key: 'tasks', countKey: 'tasks' as const },
  { href: '/notes', label: 'Notes', key: 'notes', countKey: 'notes' as const },
  { href: '/snippets', label: 'Snippets', key: 'snippets', countKey: 'snippets' as const },
];

interface Props {
  current?: string;
  onNavigate?: () => void;
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  current = '',
  onNavigate,
  mobile = false,
  onClose,
}: Props) {
  const hub = useHub();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const counts = useMemo(() => {
    const openTasks = hub.state.tasks.filter(
      (t) => !t.archived_at && t.status !== 'done' && t.status !== 'cancelled',
    ).length;
    return {
      tasks: openTasks,
      notes: hub.state.notes.length,
      snippets: hub.state.snippets.length,
    };
  }, [hub.state.tasks, hub.state.notes.length, hub.state.snippets.length]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '');
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setConfirmSignOut(false);
    onNavigate?.();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]">
      <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border)] px-4 py-4">
        <Link
          href="/"
          className="flex min-w-0 items-start gap-3"
          onClick={() => onNavigate?.()}
        >
          <AppLogo className="mt-0.5 h-9 w-9 shrink-0" />
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Private
            </span>
            <span className="mt-1 block text-lg font-semibold tracking-tight">Developer Hub</span>
          </span>
        </Link>
        {mobile && (
          <button
            type="button"
            className="btn-secondary -mr-1 mt-0.5 shrink-0 px-2 py-1.5 lg:hidden"
            aria-label="Close menu"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {links.map((link) => {
          const active = current === link.key;
          const count =
            'countKey' in link && link.countKey ? counts[link.countKey] : null;
          return (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:py-2 ${
                active
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
              }`}
            >
              <NavIcon name={link.key} />
              <span className="flex-1">{link.label}</span>
              {count != null && count > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                    active
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                      : 'bg-[var(--color-chip)] text-[var(--color-muted)]'
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] p-3">
        <Link
          href="/settings"
          onClick={() => onNavigate?.()}
          className={`mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:py-2 ${
            current === 'settings'
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <NavIcon name="settings" />
          <span>Settings</span>
        </Link>
        <div className="mb-2 truncate px-1 text-xs text-[var(--color-muted)]">{email}</div>
        {confirmSignOut ? (
          <ConfirmBanner
            compact
            title="Sign out?"
            message="You'll need to sign in again to access Developer Hub."
            confirmLabel="Sign out"
            onConfirm={() => void signOut()}
            onCancel={() => setConfirmSignOut(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary min-h-10 min-w-0 flex-1"
              onClick={() => setConfirmSignOut(true)}
            >
              Sign out
            </button>
            <ThemeIconButton />
          </div>
        )}
      </div>
    </aside>
  );
}
