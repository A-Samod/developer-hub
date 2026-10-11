# Developer Hub

A private, single-user productivity app for developers. Keep technical notes, reusable code snippets, and structured work tasks in one place — with unified search and secure cloud sync.

Built with **Next.js** and **Supabase**. Designed for personal use: one account, your data only, no custom backend server.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Database](#database)
- [Deployment](#deployment)
- [Security](#security)

---

## Overview

Developer Hub replaces scattered notes in chat threads and scratch files with a structured workspace:

| Area | Purpose |
|---|---|
| **Task Manager** | One list for office work: development, BA support, daily tasks |
| **Knowledge Base** | Long-form Markdown docs (runbooks, troubleshooting, API notes) |
| **Code Snippets** | Short, copyable commands and code samples |
| **Search** | Header search across notes, snippets, and tasks |

Sidebar order: **Dashboard → Task Manager → Knowledge Base → Code Snippets → Settings**.

---

## Features

### Dashboard (`/`)

Daily landing page.

- Quick actions: new note, new snippet, open Task Manager
- **Recent notes** — last five updated notes
- **Tasks needing attention** — in progress, due today, or overdue (not archived)

### Task Manager (`/tasks`)

Single work list for development, BA support, ops, and daily office tasks.

- Fields: title, Markdown description, category, status, priority, due date
- Statuses: Todo, In progress, Blocked, Done, Cancelled
- Priorities: Low, Medium, High, Urgent
- Quick create on the list; detail page at `/tasks/[id]`
- Views: **All**, **My day**, **Upcoming**, **In progress**, **Completed**, **By category**
- Filters: search, category, status, priority, due bucket (overdue / today / upcoming / none), and **calendar due-on date**
- Custom dropdowns (not native selects) for filters and form fields
- Client-side **pagination** (default 10 per page; 10 / 20 / 50 / 100)
- Delete with confirmation banner
- Completing a task records `completed_at`

### Knowledge Base (`/notes`)

A personal docs site for technical writing.

- Create and edit Markdown notes (`/notes/new`, `/notes/[id]`)
- Edit / preview modes with GFM (headings, lists, tables, code fences)
- Fenced code blocks highlighted with Shiki; one-click copy
- Organize with **categories**, **tags**, and **favorites**
- Filter and sort (search, category, favorites, recently updated / title)
- Custom category dropdown; pagination (default 10 per page)
- Explicit **Save**; unsaved-change and delete **confirmation banners**

### Code Snippets (`/snippets`)

A searchable library of reusable code.

- Fields: title, description, language, code, category, tags, favorite
- Languages: JavaScript, TypeScript, SQL, Shell, GraphQL, Terraform, Python, JSON (readable labels)
- Live highlighted preview and **exact** clipboard copy
- List actions: **Copy code**, **Rename**, **Delete** (row opens editor)
- Duplicate from the snippet detail form
- Filters: text, language, category, sort, favorites
- Custom dropdowns; pagination (default 10 per page)

### Global search

Search from the **app header** (desktop field + mobile expand); full results on `/search?q=`.

- Live dropdown results while typing; clear control; open full search page
- Queries notes, snippets, and tasks (archived tasks excluded from search RPC)
- PostgreSQL full-text + substring matching
- Results grouped by type with deep links

### Settings (`/settings`)

- Categories CRUD for notes, snippets, and tasks + seed defaults
- Light / dark **Appearance** theme (browser preference)
- Full-hub **Export JSON** backup
- Confirmation banners for seed and category remove

### Shared UI & UX

- Custom **SelectDropdown** listboxes (mobile-friendly) for filters and many form fields
- **ConfirmBanner** for destructive or leave-without-save actions
- Sign out confirmation in the sidebar
- Responsive shell: permanent sidebar on desktop, hamburger drawer on phones
- Touch-friendly buttons and list actions

### Authentication & privacy

- Email / password sign-in via Supabase Auth (`/login`)
- Middleware redirects unauthenticated users away from app routes
- PostgreSQL **Row Level Security (RLS)** enforces per-user data access
- Intended for a private account: create your user in the dashboard, then disable public sign-ups

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| Markdown | `react-markdown` + `remark-gfm` |
| Code highlighting | Shiki |
| Auth & database | Supabase Auth + PostgreSQL |
| Security | RLS policies + Next.js middleware |
| Search | Postgres `tsvector` + `search_developer_hub` RPC |

**Requirements:** Node.js `>= 22.12.0`

---

## Project structure

```text
developer-hub/
├── public/                 # Static assets (logo, …)
├── src/
│   ├── app/                # Next.js routes (App Router)
│   │   ├── (auth)/login/   # Sign-in
│   │   └── (app)/          # Authenticated pages
│   ├── components/         # UI by feature (notes, tasks, snippets, …)
│   │   └── ui/             # Shared: ConfirmBanner, SelectDropdown, ListPagination
│   ├── lib/
│   │   ├── hub/            # Client data layer (HubProvider)
│   │   ├── supabase/       # Browser, server, middleware clients
│   │   └── useListPagination.ts
│   ├── types/              # Domain + database types
│   └── middleware.ts       # Session refresh + route protection
├── supabase/
│   ├── migrations/         # Schema, RLS, search, seed helper
│   └── reset.sql           # Optional wipe before re-running migrations
├── .env.example
└── package.json
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
cp .env.example .env.local
```

### 2. Configure environment

In `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Use the **project URL** and **anon / publishable** key from Supabase → **Project Settings → API**. Never put the service-role key in this file.

### 3. Create the database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**.
3. (Optional) Run `supabase/reset.sql` only if you need to wipe a failed setup.
4. Run SQL:
   - **Fresh database:** run `supabase/migrations/20261011000000_init.sql`.
   - **Existing database** that already ran an older init: also run `supabase/migrations/20261011120000_tasks_redesign.sql` (task columns, drop `todos`, refresh search/seeds).

This creates tables, RLS policies, search triggers, `search_developer_hub`, and `seed_default_categories`.

### 4. Create your user

1. Supabase → **Authentication → Users** → add user (email + password).
2. **Authentication → Sign In / Providers → Email** → disable sign-ups so only your account can register.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, then go to **Settings → Seed default categories**.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run the Next.js linter |

---

## Database

Schema lives in `supabase/migrations/`. Start from `20261011000000_init.sql`; apply `20261011120000_tasks_redesign.sql` when upgrading an older DB.

| Object | Role |
|---|---|
| Tables | `categories`, `notes`, `snippets`, `tasks`, `task_resources` |
| Task extras | `estimate_minutes`, `archived_at`, `is_favorite` (columns exist; archive/estimate UI is minimal) |
| RLS | Every row is scoped to `auth.uid()` |
| Search triggers | Keep `search_vector` updated on insert/update |
| `search_developer_hub(query)` | Unified search RPC used by header search and `/search` |
| `seed_default_categories()` | Inserts default categories if the user has none |

`supabase/reset.sql` drops these objects. Use it only when intentionally recreating the schema (it deletes data).

**Data loading:** Hub loads the user’s notes, snippets, and tasks into the client; list pages filter/sort in memory and paginate for display.

---

## Deployment

| Piece | Recommendation |
|---|---|
| Frontend | [Vercel](https://vercel.com) — set the same `NEXT_PUBLIC_SUPABASE_*` env vars |
| Backend | Supabase Free is enough for personal use |

**Backups:** Free-tier automatic backups are limited. Use **Settings → Export JSON** regularly, and note that inactive Free projects may pause after a week without database activity.

---

## Security

- Only the **anon / publishable** key is used in the browser; RLS is the real access control.
- Do not commit `.env.local`.
- Disable public sign-up after creating your account.
- Avoid storing production secrets or API keys inside notes/snippets.
- Treat the database as private personal data and keep exports.
