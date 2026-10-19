import { Suspense } from 'react';
import SettingsPage from '@/components/settings/SettingsPage';

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-muted)]">Loading settings…</p>}>
      <SettingsPage />
    </Suspense>
  );
}
