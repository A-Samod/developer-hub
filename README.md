# Developer Hub

A private, single-user productivity app for developers. Keep technical notes, reusable code snippets, quick to-dos, and structured development tasks in one place — with unified search and secure cloud sync.

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
| **Code Snippets** | Short, copyable commands and code samples |
| **To-dos** | Fast capture for small personal tasks |
| **Task Manager** | Track real development work (bugs, features, deployments, etc.) |
| **Search** | Find anything across all of the above |

---

## Features

### Dashboard (`/`)

Your daily landing page.

- Quick actions: new note, new snippet, to-dos, tasks, search
- **Recent notes** — last updated items
- **Today’s to-dos** — due today or overdue
- **Tasks needing attention** — in progress, due today, or overdue, sorted by urgency

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

### To-dos (`/todos`)

Lightweight task capture — separate from full development tasks.

- Quick-add with title only
- Mark complete with a checkbox; edit title, priority, due date, and notes inline
- Filters: all / active / completed, priority, due date (overdue, today, upcoming, none)
- Sort by created date or due date
- Overdue items highlighted

### Task Manager (`/tasks`)

Structured work tracking for real development items.

- Fields: title, Markdown description, category, status, priority, due date
- Statuses: To do, In progress, Blocked, Done, Cancelled
- Priorities: Low, Medium, High, Urgent
- Views: **All**, **My day**, **Upcoming**, **In progress**, **Completed**, **By category**
- Extra filters: text, category, status, priority, due-date bucket
- Default sort: overdue first → higher priority → nearest due date
- Detail page (`/tasks/[id]`) with related **notes** and **snippets** linked as resources
- Completing a task records `completed_at`

### Global search (`/search`)

One search box across the hub.

- Queries notes, snippets, to-dos, and tasks
- Uses PostgreSQL full-text search on indexed content
- Also matches substrings (useful for code like `main(input)` or CLI flags)
- Results grouped by type, with excerpt and deep link to the record
- Query synced to the URL (`?q=`)

### Settings (`/settings`)

Account workspace preferences.

- CRUD for categories (scoped to notes, snippets, or tasks)
- **Seed default categories** for a fresh account
- Light / dark theme (stored in the browser)
- **Export JSON** of all hub data for backup

### Mobile layout

- Responsive shell: permanent sidebar on desktop, hamburger + slide-out drawer on phones
- Stacked page headers, full-width filters, and touch-friendly list actions on small screens

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
4. Select all of `supabase/migrations/20261011000000_init.sql` and **Run**.

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
| Tables | `categories`, `notes`, `snippets`, `todos`, `tasks`, `task_resources` |
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
