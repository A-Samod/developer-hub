'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function Sidebar({ current = '' }: { current?: string }) {
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
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]">
      <div className="border-b border-[var(--color-border)] px-4 py-4">
        <Link href="/" className="block">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Private
          </div>
          <div className="mt-1 text-lg font-semibold tracking-tight">Developer Hub</div>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
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
        <button type="button" className="btn-secondary w-full" onClick={signOut}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
