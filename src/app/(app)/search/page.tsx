import { Suspense } from 'react';
import SearchPage from '@/components/search/SearchPage';

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-muted)]">Loading search…</p>}>
      <SearchPage />
    </Suspense>
  );
}
