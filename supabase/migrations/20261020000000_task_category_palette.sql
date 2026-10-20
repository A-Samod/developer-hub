-- Task category palette (avoids status red / amber / accent blue).
-- Updates seed defaults and existing rows that match the six task category names.

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
    -- Snippets (topics; language is separate)
    (uid, 'Git', 'snippet', '#334155', 0),
    (uid, 'Database', 'snippet', '#8b5cf6', 1),
    (uid, 'App', 'snippet', '#0ea5e9', 2),
    (uid, 'Shell', 'snippet', '#14b8a6', 3),
    -- Tasks
    (uid, 'Meetings', 'task', '#ec4899', 0),
    (uid, 'BA Support', 'task', '#14b8a6', 1),
    (uid, 'Bug Fix', 'task', '#f97316', 2),
    (uid, 'Feature', 'task', '#8b5cf6', 3),
    (uid, 'Testing', 'task', '#84cc16', 4),
    (uid, 'Development', 'task', '#0ea5e9', 5);
end;
$$;

update public.categories set color = '#ec4899', position = 0
where entity_type = 'task' and name = 'Meetings';

update public.categories set color = '#14b8a6', position = 1
where entity_type = 'task' and name = 'BA Support';

update public.categories set color = '#f97316', position = 2
where entity_type = 'task' and name = 'Bug Fix';

update public.categories set color = '#8b5cf6', position = 3
where entity_type = 'task' and name = 'Feature';

update public.categories set color = '#84cc16', position = 4
where entity_type = 'task' and name = 'Testing';

update public.categories set color = '#0ea5e9', position = 5
where entity_type = 'task' and name = 'Development';
