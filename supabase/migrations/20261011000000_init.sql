-- Developer Hub schema, RLS, search RPC
-- Run the ENTIRE file in the Supabase SQL Editor (select all → Run).
-- If a previous attempt failed partway, run ../reset.sql first, then this file.

create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.priority_level as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_status as enum ('todo', 'in_progress', 'blocked', 'done', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.category_entity_type as enum ('note', 'snippet', 'task');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.resource_type as enum ('note', 'snippet');
exception when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  entity_type public.category_entity_type not null,
  color text not null default '#64748b',
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content_md text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  language text not null default 'text',
  code text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text not null default '',
  is_completed boolean not null default false,
  priority public.priority_level not null default 'medium',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  status public.task_status not null default 'todo',
  priority public.priority_level not null default 'medium',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.task_resources (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  resource_type public.resource_type not null,
  resource_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index if not exists snippets_user_updated_idx on public.snippets (user_id, updated_at desc);
create index if not exists todos_user_created_idx on public.todos (user_id, created_at desc);
create index if not exists tasks_user_updated_idx on public.tasks (user_id, updated_at desc);
create index if not exists categories_user_entity_idx on public.categories (user_id, entity_type);
create index if not exists task_resources_task_idx on public.task_resources (task_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes
for each row execute function public.set_updated_at();

drop trigger if exists snippets_set_updated_at on public.snippets;
create trigger snippets_set_updated_at before update on public.snippets
for each row execute function public.set_updated_at();

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at before update on public.todos
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

-- RLS
alter table public.categories enable row level security;
alter table public.notes enable row level security;
alter table public.snippets enable row level security;
alter table public.todos enable row level security;
alter table public.tasks enable row level security;
alter table public.task_resources enable row level security;

-- Categories policies
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories for delete to authenticated
using ((select auth.uid()) = user_id);

-- Notes policies
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes for delete to authenticated
using ((select auth.uid()) = user_id);

-- Snippets policies
drop policy if exists "snippets_select_own" on public.snippets;
create policy "snippets_select_own" on public.snippets for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "snippets_insert_own" on public.snippets;
create policy "snippets_insert_own" on public.snippets for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "snippets_update_own" on public.snippets;
create policy "snippets_update_own" on public.snippets for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "snippets_delete_own" on public.snippets;
create policy "snippets_delete_own" on public.snippets for delete to authenticated
using ((select auth.uid()) = user_id);

-- Todos policies
drop policy if exists "todos_select_own" on public.todos;
create policy "todos_select_own" on public.todos for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "todos_insert_own" on public.todos;
create policy "todos_insert_own" on public.todos for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "todos_update_own" on public.todos;
create policy "todos_update_own" on public.todos for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "todos_delete_own" on public.todos;
create policy "todos_delete_own" on public.todos for delete to authenticated
using ((select auth.uid()) = user_id);

-- Tasks policies
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete to authenticated
using ((select auth.uid()) = user_id);

-- Task resources: access via owning task
drop policy if exists "task_resources_select_own" on public.task_resources;
create policy "task_resources_select_own" on public.task_resources for select to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  )
);

drop policy if exists "task_resources_insert_own" on public.task_resources;
create policy "task_resources_insert_own" on public.task_resources for insert to authenticated
with check (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  )
);

drop policy if exists "task_resources_update_own" on public.task_resources;
create policy "task_resources_update_own" on public.task_resources for update to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  )
);

drop policy if exists "task_resources_delete_own" on public.task_resources;
create policy "task_resources_delete_own" on public.task_resources for delete to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  )
);

-- Full-text search vectors (trigger-maintained; to_tsvector is not IMMUTABLE so
-- GENERATED ALWAYS columns are rejected by Postgres with 42P17)
alter table public.notes add column if not exists search_vector tsvector;
alter table public.snippets add column if not exists search_vector tsvector;
alter table public.todos add column if not exists search_vector tsvector;
alter table public.tasks add column if not exists search_vector tsvector;

create or replace function public.notes_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.content_md, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'C');
  return new;
end;
$$;

create or replace function public.snippets_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.code, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'C');
  return new;
end;
$$;

create or replace function public.todos_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.notes, '')), 'B');
  return new;
end;
$$;

create or replace function public.tasks_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end;
$$;

drop trigger if exists notes_search_vector_trigger on public.notes;
create trigger notes_search_vector_trigger
before insert or update of title, content_md, tags on public.notes
for each row execute function public.notes_search_vector_update();

drop trigger if exists snippets_search_vector_trigger on public.snippets;
create trigger snippets_search_vector_trigger
before insert or update of title, description, code, tags on public.snippets
for each row execute function public.snippets_search_vector_update();

drop trigger if exists todos_search_vector_trigger on public.todos;
create trigger todos_search_vector_trigger
before insert or update of title, notes on public.todos
for each row execute function public.todos_search_vector_update();

drop trigger if exists tasks_search_vector_trigger on public.tasks;
create trigger tasks_search_vector_trigger
before insert or update of title, description on public.tasks
for each row execute function public.tasks_search_vector_update();

create index if not exists notes_search_idx on public.notes using gin (search_vector);
create index if not exists snippets_search_idx on public.snippets using gin (search_vector);
create index if not exists todos_search_idx on public.todos using gin (search_vector);
create index if not exists tasks_search_idx on public.tasks using gin (search_vector);

-- Unified search RPC (FTS + substring for code-like queries)
create or replace function public.search_developer_hub(query_text text)
returns table (
  id uuid,
  type text,
  title text,
  excerpt text,
  category_name text,
  tags text[],
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select
      nullif(trim(query_text), '') as raw,
      websearch_to_tsquery('english', coalesce(nullif(trim(query_text), ''), ' ')) as tsq,
      '%' || lower(trim(query_text)) || '%' as like_pat
  )
  select n.id, 'note'::text as type, n.title,
    left(n.content_md, 160) as excerpt,
    c.name as category_name,
    n.tags,
    n.updated_at
  from public.notes n
  left join public.categories c on c.id = n.category_id
  cross join q
  where n.user_id = auth.uid()
    and q.raw is not null
    and (
      (q.tsq is not null and n.search_vector @@ q.tsq)
      or lower(n.title) like q.like_pat
      or lower(n.content_md) like q.like_pat
      or exists (select 1 from unnest(n.tags) t where lower(t) like q.like_pat)
    )

  union all

  select s.id, 'snippet'::text, s.title,
    left(coalesce(nullif(s.description, ''), s.code), 160),
    c.name,
    s.tags,
    s.updated_at
  from public.snippets s
  left join public.categories c on c.id = s.category_id
  cross join q
  where s.user_id = auth.uid()
    and q.raw is not null
    and (
      (q.tsq is not null and s.search_vector @@ q.tsq)
      or lower(s.title) like q.like_pat
      or lower(s.description) like q.like_pat
      or lower(s.code) like q.like_pat
      or exists (select 1 from unnest(s.tags) t where lower(t) like q.like_pat)
    )

  union all

  select t.id, 'todo'::text, t.title,
    left(t.notes, 160),
    null::text,
    null::text[],
    t.updated_at
  from public.todos t
  cross join q
  where t.user_id = auth.uid()
    and q.raw is not null
    and (
      (q.tsq is not null and t.search_vector @@ q.tsq)
      or lower(t.title) like q.like_pat
      or lower(t.notes) like q.like_pat
    )

  union all

  select tk.id, 'task'::text, tk.title,
    left(tk.description, 160),
    c.name,
    null::text[],
    tk.updated_at
  from public.tasks tk
  left join public.categories c on c.id = tk.category_id
  cross join q
  where tk.user_id = auth.uid()
    and q.raw is not null
    and (
      (q.tsq is not null and tk.search_vector @@ q.tsq)
      or lower(tk.title) like q.like_pat
      or lower(tk.description) like q.like_pat
    )

  order by updated_at desc
  limit 100;
$$;

grant execute on function public.search_developer_hub(text) to authenticated;

-- Seed default categories for the current user (call after signup)
create or replace function public.seed_default_categories()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.categories where user_id = uid) then
    return;
  end if;

  insert into public.categories (user_id, name, entity_type, color) values
    (uid, 'Git and GitHub', 'note', '#334155'),
    (uid, 'JavaScript and TypeScript', 'note', '#ca8a04'),
    (uid, 'WorkHub24', 'note', '#0f766e'),
    (uid, 'AWS and Deployment', 'note', '#c2410c'),
    (uid, 'APIs and Integrations', 'note', '#1d4ed8'),
    (uid, 'Troubleshooting', 'note', '#b91c1c'),
    (uid, 'Database and SQL', 'note', '#7c3aed'),
    (uid, 'General Notes', 'note', '#475569'),
    (uid, 'JavaScript', 'snippet', '#ca8a04'),
    (uid, 'SQL', 'snippet', '#7c3aed'),
    (uid, 'Shell', 'snippet', '#334155'),
    (uid, 'Infrastructure', 'snippet', '#0f766e'),
    (uid, 'Bug Fix', 'task', '#dc2626'),
    (uid, 'Feature', 'task', '#2563eb'),
    (uid, 'Improvement', 'task', '#0891b2'),
    (uid, 'Deployment', 'task', '#c2410c'),
    (uid, 'Testing', 'task', '#16a34a'),
    (uid, 'Research', 'task', '#7c3aed'),
    (uid, 'Documentation', 'task', '#475569'),
    (uid, 'Maintenance', 'task', '#64748b'),
    (uid, 'Other', 'task', '#94a3b8');
end;
$$;

grant execute on function public.seed_default_categories() to authenticated;
