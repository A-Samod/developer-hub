# Developer Hub

Private personal hub for notes, snippets, to-dos, and development tasks.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/reset.sql` only if you need a clean slate, then run all of `supabase/migrations/20261011000000_init.sql`.
3. **Authentication → Users** → add your email/password user.
4. **Authentication → Sign In / Providers → Email** → disable sign-ups.
5. `npm run dev` → [http://localhost:3000](http://localhost:3000) → sign in.
6. **Settings → Seed default categories**.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |

## Deploy

- App: Vercel (same env vars)
- Data: Supabase Free is fine for personal use; export from Settings for backups
