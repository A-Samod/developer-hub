-- Manual category order per user + entity_type.
alter table public.categories
  add column if not exists position integer not null default 0;

-- Backfill existing rows (stable: created_at, then name).
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, entity_type
      order by created_at asc, name asc
    ) - 1 as pos
  from public.categories
)
update public.categories c
set position = ranked.pos
from ranked
where c.id = ranked.id;

create index if not exists categories_user_entity_position_idx
  on public.categories (user_id, entity_type, position);

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

  insert into public.categories (user_id, name, entity_type, color, position) values
    (uid, 'Git and GitHub', 'note', '#334155', 0),
    (uid, 'JavaScript and TypeScript', 'note', '#ca8a04', 1),
    (uid, 'WorkHub24', 'note', '#0f766e', 2),
    (uid, 'AWS and Deployment', 'note', '#0f766e', 3),
    (uid, 'APIs and Integrations', 'note', '#1d4ed8', 4),
    (uid, 'Troubleshooting', 'note', '#7c3aed', 5),
    (uid, 'Database and SQL', 'note', '#7c3aed', 6),
    (uid, 'General Notes', 'note', '#475569', 7),
    (uid, 'JavaScript', 'snippet', '#ca8a04', 0),
    (uid, 'SQL', 'snippet', '#7c3aed', 1),
    (uid, 'Shell', 'snippet', '#334155', 2),
    (uid, 'Infrastructure', 'snippet', '#0f766e', 3),
    (uid, 'Development', 'task', '#2563eb', 0),
    (uid, 'BA Support', 'task', '#0891b2', 1),
    (uid, 'Ops', 'task', '#0f766e', 2),
    (uid, 'Bug Fix', 'task', '#dc2626', 3),
    (uid, 'Feature', 'task', '#1d4ed8', 4),
    (uid, 'Improvement', 'task', '#0f766e', 5),
    (uid, 'Deployment', 'task', '#0891b2', 6),
    (uid, 'Testing', 'task', '#16a34a', 7),
    (uid, 'Research', 'task', '#7c3aed', 8),
    (uid, 'Documentation', 'task', '#475569', 9),
    (uid, 'Maintenance', 'task', '#64748b', 10),
    (uid, 'Other', 'task', '#94a3b8', 11);
end;
$$;
