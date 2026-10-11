import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4 py-10 dark:bg-[var(--color-surface)]">
      <div className="w-full max-w-[420px]">
        <Suspense
          fallback={
            <div className="rounded-[1.75rem] bg-white p-10 text-sm text-[var(--color-muted)] shadow-[0_12px_40px_rgba(15,23,42,0.08)] dark:bg-[var(--color-panel)]">
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
