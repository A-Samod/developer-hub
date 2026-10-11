'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLogo from '@/components/layout/AppLogo';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/', label: 'Dashboard', key: 'dashboard' },
  { href: '/notes', label: 'Knowledge Base', key: 'notes' },
  { href: '/snippets', label: 'Code Snippets', key: 'snippets' },
  { href: '/todos', label: 'To-dos', key: 'todos' },
  { href: '/tasks', label: 'Task Manager', key: 'tasks' },
  { href: '/search', label: 'Search', key: 'search' },
  { href: '/settings', label: 'Settings', key: 'settings' },
];

interface Props {
  current?: string;
  onNavigate?: () => void;
  /** Mobile drawer only — never shown on the permanent desktop sidebar */
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  current = '',
  onNavigate,
  mobile = false,
  onClose,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '');
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
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
        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            onClick={() => onNavigate?.()}
            className={`rounded-md px-3 py-2.5 text-sm font-medium transition lg:py-2 ${
              current === link.key
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-[var(--color-border)] p-3">
        <div className="mb-2 truncate text-xs text-[var(--color-muted)]">{email}</div>
        <button type="button" className="btn-secondary w-full min-h-10" onClick={signOut}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
