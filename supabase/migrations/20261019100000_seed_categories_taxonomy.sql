-- Lean default categories aligned to real usage.
-- Notes: Git, Deployment, Integrations, General Notes
-- Snippets: topic buckets (not language names) — Git, Database, App, Shell
-- Tasks: Meetings, BA Support, Bug Fix, Feature, Testing, Development
-- Does not modify existing user categories; only replaces seed_default_categories().

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
    -- Notes
    (uid, 'Git', 'note', '#334155', 0),
    (uid, 'Deployment', 'note', '#0f766e', 1),
    (uid, 'Integrations', 'note', '#1d4ed8', 2),
    (uid, 'General Notes', 'note', '#475569', 3),
    -- Snippets (topics; language is a separate field)
    (uid, 'Git', 'snippet', '#334155', 0),
    (uid, 'Database', 'snippet', '#7c3aed', 1),
    (uid, 'App', 'snippet', '#2563eb', 2),
    (uid, 'Shell', 'snippet', '#0f766e', 3),
    -- Tasks
    (uid, 'Meetings', 'task', '#64748b', 0),
    (uid, 'BA Support', 'task', '#0891b2', 1),
    (uid, 'Bug Fix', 'task', '#dc2626', 2),
    (uid, 'Feature', 'task', '#1d4ed8', 3),
    (uid, 'Testing', 'task', '#16a34a', 4),
    (uid, 'Development', 'task', '#2563eb', 5);
end;
$$;
