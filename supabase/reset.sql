-- Optional cleanup before a fresh run of migrations/20261011000000_init.sql
-- Safe to run even if some objects are missing.

drop table if exists public.task_resources cascade;
drop table if exists public.tasks cascade;
drop table if exists public.todos cascade;
drop table if exists public.snippets cascade;
drop table if exists public.notes cascade;
drop table if exists public.categories cascade;

drop function if exists public.search_developer_hub(text);
drop function if exists public.seed_default_categories();
drop function if exists public.notes_search_vector_update();
drop function if exists public.snippets_search_vector_update();
drop function if exists public.todos_search_vector_update();
drop function if exists public.tasks_search_vector_update();
drop function if exists public.set_updated_at();

drop type if exists public.resource_type;
drop type if exists public.category_entity_type;
drop type if exists public.task_status;
drop type if exists public.priority_level;
