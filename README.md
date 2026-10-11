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
| **Knowledge Base** | Long-form Markdown docs (runbooks, troubleshooting, API notes) |
| **Code Snippets** | Short, copyable commands and code samples (e.g. daily git commands) |
| **Task Manager** | One list for office work: development, BA support, daily tasks |
| **Search** | Header search across notes, snippets, and tasks |

---

## Features

### Dashboard (`/`)

Your daily landing page (blocks can be toggled in Settings).

- Quick add: task for today / tomorrow, new note, new snippet
- **Pinned / favorites** — starred notes, snippets, and tasks
- **Today** — due today or overdue (non-archived)
- **Overdue** — overdue active tasks
- **Recent notes** — last updated items

### Knowledge Base (`/notes`)

A personal docs site for technical writing.

- Create and edit Markdown notes (`/notes/new`, `/notes/[id]`)
- Edit / preview modes with GFM support (headings, lists, tables, code fences)
- Fenced code blocks highlighted with Shiki; one-click copy
- Organize with **categories**, **tags**, and **favorites**
- Filter and sort lists (search text, category, favorites, recently updated / title)
- Explicit **Save** button; browser warns if you leave with unsaved changes

### Code Snippets (`/snippets`)

A searchable library of reusable code.

- Fields: title, description, language, code, category, tags, favorite
- Languages include JavaScript, TypeScript, SQL, shell, GraphQL, Terraform, Python, JSON
- Live highlighted preview and **exact** clipboard copy (whitespace preserved)
- Duplicate a snippet to fork it quickly
- Filter by text, language, category, and favorites

### Task Manager (`/tasks`)

Single work list for development, BA support, ops, and daily office tasks.

- Fields: title, Markdown description, category, status, priority, due date, optional **effort estimate** (hours + minutes), favorite, archive
- Checkbox complete on the list; richer status on the detail page
- Quick add for **Today** / **Tomorrow**; create form with estimate
- Views: **My day** (default), **Upcoming**, **In progress**, **Completed**, **Archived**, **All**, **By category**
- Filters: text, category, status, priority, due bucket, **due from / due to** date range
- Soft-delete via **Archive**; hard delete from archived items
- Export filtered list as **JSON** or **CSV**
- Detail page (`/tasks/[id]`) with linked notes and snippets
- Completing a task records `completed_at`

### Global search (`/search`)

Search from the **app header** (desktop field + mobile icon); results on `/search`.

- Queries notes, snippets, and tasks (archived tasks excluded)
- PostgreSQL full-text + substring matching
- Results grouped by type with deep links; query synced to `?q=`

### Settings (`/settings`)

- **Workspace:** default Task Manager view; dashboard block toggles (browser `localStorage`)
- Categories CRUD (notes, snippets, tasks) + seed defaults
- Light / dark theme
- Full-hub **Export JSON** backup

### Mobile layout

- Responsive shell: permanent sidebar on desktop, hamburger drawer on phones
- Global search in the mobile header; desktop top search bar
- Task filters collapse behind a **Filters** control on small screens
- Touch-friendly checkboxes and overflow menus on task rows

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
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js routes (App Router)
│   │   ├── (auth)/login/   # Sign-in
│   │   └── (app)/          # Authenticated pages
│   ├── components/         # UI by feature (notes, tasks, …)
│   ├── lib/
│   │   ├── hub/            # Client data layer (HubProvider)
│   │   └── supabase/       # Browser, server, middleware clients
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
   - **Fresh database:** run `supabase/migrations/20261011000000_init.sql` (current schema, no todos).
   - **Existing database** that already ran an older init: also run `supabase/migrations/20261011120000_tasks_redesign.sql` to add task fields, drop `todos`, and refresh search/seeds.

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

Schema lives in `supabase/migrations/20261011000000_init.sql`.

| Object | Role |
|---|---|
| Tables | `categories`, `notes`, `snippets`, `tasks`, `task_resources` |
| RLS | Every row is scoped to `auth.uid()` |
| Search triggers | Keep `search_vector` updated on insert/update |
| `search_developer_hub(query)` | Unified search RPC used by the Search page |
| `seed_default_categories()` | Inserts default categories if the user has none |

`supabase/reset.sql` drops these objects. Use it only when intentionally recreating the schema (it deletes data).

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
