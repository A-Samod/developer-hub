-- Soften default Deployment / Ops category colors; keep Bug Fix red for warnings.
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
    (uid, 'AWS and Deployment', 'note', '#0f766e'),
    (uid, 'APIs and Integrations', 'note', '#1d4ed8'),
    (uid, 'Troubleshooting', 'note', '#7c3aed'),
    (uid, 'Database and SQL', 'note', '#7c3aed'),
    (uid, 'General Notes', 'note', '#475569'),
    (uid, 'JavaScript', 'snippet', '#ca8a04'),
    (uid, 'SQL', 'snippet', '#7c3aed'),
    (uid, 'Shell', 'snippet', '#334155'),
    (uid, 'Infrastructure', 'snippet', '#0f766e'),
    (uid, 'Development', 'task', '#2563eb'),
    (uid, 'BA Support', 'task', '#0891b2'),
    (uid, 'Ops', 'task', '#0f766e'),
    (uid, 'Bug Fix', 'task', '#dc2626'),
    (uid, 'Feature', 'task', '#1d4ed8'),
    (uid, 'Improvement', 'task', '#0f766e'),
    (uid, 'Deployment', 'task', '#0891b2'),
    (uid, 'Testing', 'task', '#16a34a'),
    (uid, 'Research', 'task', '#7c3aed'),
    (uid, 'Documentation', 'task', '#475569'),
    (uid, 'Maintenance', 'task', '#64748b'),
    (uid, 'Other', 'task', '#94a3b8');
end;
$$;

-- Update existing seeded colors that clash with danger/overdue reds.
update public.categories
set color = '#0f766e'
where lower(color) = '#c2410c'
  and name in ('AWS and Deployment', 'Ops');

update public.categories
set color = '#0891b2'
where lower(color) = '#ea580c'
  and name = 'Deployment';

update public.categories
set color = '#7c3aed'
where lower(color) = '#b91c1c'
  and name = 'Troubleshooting';
