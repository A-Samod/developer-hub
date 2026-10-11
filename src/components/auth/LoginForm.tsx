'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const REMEMBER_KEY = 'developer-hub.remember-email';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured()) {
      setError('Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }
      const next = searchParams.get('next') || '/';
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[1.75rem] bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-10 dark:bg-[var(--color-panel)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="mb-8 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark-128.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-xl object-cover"
          decoding="async"
        />
        <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          Developer Hub
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">Welcome back</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Sign in to access your Developer Hub workspace
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        <div>
          <label
            className="mb-2 block text-sm font-medium text-[var(--color-muted)]"
            htmlFor="email"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="Enter your email address"
            className="w-full rounded-xl border-0 bg-[#f0f2f5] px-4 py-3.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[#9aa3af] focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-[#243041] dark:placeholder:text-[#7a8699]"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium text-[var(--color-muted)]"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-xl border-0 bg-[#f0f2f5] px-4 py-3.5 pr-16 text-sm text-[var(--color-ink)] outline-none placeholder:text-[#9aa3af] focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-[#243041] dark:placeholder:text-[#7a8699]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)] text-[#1a365d] accent-[#1a365d]"
          />
          Remember me
        </label>

        {error && (
          <div className="rounded-xl bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full cursor-pointer rounded-full bg-[#1a365d] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#234a7a] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#1a365d] dark:bg-[#2d4a7a] dark:hover:bg-[#3a5f96] dark:disabled:hover:bg-[#2d4a7a]"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
