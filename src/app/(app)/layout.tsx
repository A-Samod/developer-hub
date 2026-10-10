import { HubProvider } from '@/lib/hub/HubProvider';
import { AppShell } from './AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HubProvider>
      <AppShell>{children}</AppShell>
    </HubProvider>
  );
}
