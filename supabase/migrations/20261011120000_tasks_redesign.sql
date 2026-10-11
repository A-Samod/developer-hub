-- Task Manager redesign: estimates, archive, favorites; drop todos; refresh search + seeds

alter table public.tasks
  add column if not exists estimate_minutes integer,
  add column if not exists archived_at timestamptz,
  add column if not exists is_favorite boolean not null default false;

alter table public.tasks
  drop constraint if exists tasks_estimate_minutes_check;

alter table public.tasks
  add constraint tasks_estimate_minutes_check
  check (estimate_minutes is null or estimate_minutes >= 0);

create index if not exists tasks_user_archived_idx
  on public.tasks (user_id, archived_at);

-- Drop todos stack
drop trigger if exists todos_search_vector_trigger on public.todos;
drop trigger if exists todos_set_updated_at on public.todos;
drop function if exists public.todos_search_vector_update();
drop index if exists public.todos_search_idx;
drop index if exists public.todos_user_created_idx;
drop table if exists public.todos cascade;

-- Search without todos; skip archived tasks
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

  select tk.id, 'task'::text, tk.title,
    left(tk.description, 160),
    c.name,
    null::text[],
    tk.updated_at
  from public.tasks tk
  left join public.categories c on c.id = tk.category_id
  cross join q
  where tk.user_id = auth.uid()
    and tk.archived_at is null
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
    (uid, 'Development', 'task', '#2563eb'),
    (uid, 'BA Support', 'task', '#0891b2'),
    (uid, 'Ops', 'task', '#c2410c'),
    (uid, 'Bug Fix', 'task', '#dc2626'),
    (uid, 'Feature', 'task', '#1d4ed8'),
    (uid, 'Improvement', 'task', '#0f766e'),
    (uid, 'Deployment', 'task', '#ea580c'),
    (uid, 'Testing', 'task', '#16a34a'),
    (uid, 'Research', 'task', '#7c3aed'),
    (uid, 'Documentation', 'task', '#475569'),
    (uid, 'Maintenance', 'task', '#64748b'),
    (uid, 'Other', 'task', '#94a3b8');
end;
$$;

grant execute on function public.seed_default_categories() to authenticated;
