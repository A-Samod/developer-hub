'use client';

import { usePathname } from 'next/navigation';
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
  return (
    <div className="flex min-h-screen">
      <Sidebar current={currentFromPath(pathname)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
