'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { nowIso } from '@/lib/dates';
import type {
  Category,
  CategoryEntityType,
  HubState,
  Note,
  SearchResult,
  Snippet,
  Task,
  TaskResource,
  TaskStatus,
} from '@/types/models';

type HubContextValue = {
  state: HubState;
  loading: boolean;
  error: string | null;
  userId: string | null;
  refresh: () => Promise<void>;
  listCategories: (entityType?: CategoryEntityType) => Category[];
  getCategory: (id: string | null | undefined) => Category | undefined;
  createCategory: (input: {
    name: string;
    entity_type: CategoryEntityType;
    color: string;
  }) => Promise<Category>;
  updateCategory: (
    id: string,
    patch: Partial<Pick<Category, 'name' | 'color'>>,
  ) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  getNote: (id: string) => Note | undefined;
  createNote: (
    input: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<Note>;
  updateNote: (
    id: string,
    patch: Partial<Omit<Note, 'id' | 'user_id' | 'created_at'>>,
  ) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  getSnippet: (id: string) => Snippet | undefined;
  createSnippet: (
    input: Omit<Snippet, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<Snippet>;
  updateSnippet: (
    id: string,
    patch: Partial<Omit<Snippet, 'id' | 'user_id' | 'created_at'>>,
  ) => Promise<Snippet | null>;
  deleteSnippet: (id: string) => Promise<boolean>;
  duplicateSnippet: (id: string) => Promise<Snippet | null>;
  getTask: (id: string) => Task | undefined;
  createTask: (
    input: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'> & {
      completed_at?: string | null;
    },
  ) => Promise<Task>;
  updateTask: (
    id: string,
    patch: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>,
  ) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  listTaskResources: (taskId: string) => TaskResource[];
  setTaskResources: (
    taskId: string,
    resources: Array<{ resource_type: 'note' | 'snippet'; resource_id: string }>,
  ) => Promise<void>;
  search: (query: string) => Promise<SearchResult[]>;
  exportJson: () => string;
  exportTasksJson: (tasks?: Task[]) => string;
  exportTasksCsv: (tasks?: Task[]) => string;
  seedCategoriesIfEmpty: () => Promise<void>;
};

const emptyState: HubState = {
  categories: [],
  notes: [],
  snippets: [],
  tasks: [],
  task_resources: [],
};

const HubContext = createContext<HubContextValue | null>(null);

function requireUserId(userId: string | null): string {
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export function HubProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<HubState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      setUserId(null);
      setState(emptyState);
      return;
    }
    setUserId(user.id);

    const [categories, notes, snippets, tasks, task_resources] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('notes').select('*').order('updated_at', { ascending: false }),
      supabase.from('snippets').select('*').order('updated_at', { ascending: false }),
      supabase.from('tasks').select('*').order('updated_at', { ascending: false }),
      supabase.from('task_resources').select('*'),
    ]);

    const firstError =
      categories.error ||
      notes.error ||
      snippets.error ||
      tasks.error ||
      task_resources.error;
    if (firstError) throw firstError;

    setState({
      categories: (categories.data ?? []) as Category[],
      notes: (notes.data ?? []) as Note[],
      snippets: (snippets.data ?? []) as Snippet[],
      tasks: (tasks.data ?? []) as Task[],
      task_resources: (task_resources.data ?? []) as TaskResource[],
    });
  }, [supabase]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refresh();
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const seedCategoriesIfEmpty = useCallback(async () => {
    await supabase.rpc('seed_default_categories');
    await refresh();
  }, [supabase, refresh]);

  const value = useMemo<HubContextValue>(() => {
    return {
      state,
      loading,
      error,
      userId,
      refresh,
      seedCategoriesIfEmpty,

      listCategories(entityType?: CategoryEntityType) {
        return entityType
          ? state.categories.filter((c) => c.entity_type === entityType)
          : state.categories;
      },
      getCategory(id) {
        if (!id) return undefined;
        return state.categories.find((c) => c.id === id);
      },
      async createCategory(input) {
        const uid = requireUserId(userId);
        const { data, error: err } = await supabase
          .from('categories')
          .insert({
            user_id: uid,
            name: input.name.trim(),
            entity_type: input.entity_type,
            color: input.color,
          })
          .select()
          .single();
        if (err) throw err;
        const category = data as Category;
        setState((s) => ({ ...s, categories: [...s.categories, category] }));
        return category;
      },
      async updateCategory(id, patch) {
        const { data, error: err } = await supabase
          .from('categories')
          .update(patch)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (err) throw err;
        if (!data) return null;
        const category = data as Category;
        setState((s) => ({
          ...s,
          categories: s.categories.map((c) => (c.id === id ? category : c)),
        }));
        return category;
      },
      async deleteCategory(id) {
        const { error: err } = await supabase.from('categories').delete().eq('id', id);
        if (err) throw err;
        setState((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
        }));
        return true;
      },

      getNote(id) {
        return state.notes.find((n) => n.id === id);
      },
      async createNote(input) {
        const uid = requireUserId(userId);
        const { data, error: err } = await supabase
          .from('notes')
          .insert({
            user_id: uid,
            title: input.title,
            content_md: input.content_md,
            category_id: input.category_id,
            tags: input.tags,
            is_favorite: input.is_favorite,
          })
          .select()
          .single();
        if (err) throw err;
        const note = data as Note;
        setState((s) => ({ ...s, notes: [note, ...s.notes] }));
        return note;
      },
      async updateNote(id, patch) {
        const { data, error: err } = await supabase
          .from('notes')
          .update({ ...patch, updated_at: nowIso() })
          .eq('id', id)
          .select()
          .maybeSingle();
        if (err) throw err;
        if (!data) return null;
        const note = data as Note;
        setState((s) => ({
          ...s,
          notes: s.notes.map((n) => (n.id === id ? note : n)),
        }));
        return note;
      },
      async deleteNote(id) {
        const { error: err } = await supabase.from('notes').delete().eq('id', id);
        if (err) throw err;
        setState((s) => ({
          ...s,
          notes: s.notes.filter((n) => n.id !== id),
          task_resources: s.task_resources.filter(
            (r) => !(r.resource_type === 'note' && r.resource_id === id),
          ),
        }));
        return true;
      },

      getSnippet(id) {
        return state.snippets.find((n) => n.id === id);
      },
      async createSnippet(input) {
        const uid = requireUserId(userId);
        const { data, error: err } = await supabase
          .from('snippets')
          .insert({
            user_id: uid,
            title: input.title,
            description: input.description,
            language: input.language,
            code: input.code,
            category_id: input.category_id,
            tags: input.tags,
            is_favorite: input.is_favorite,
          })
          .select()
          .single();
        if (err) throw err;
        const snippet = data as Snippet;
        setState((s) => ({ ...s, snippets: [snippet, ...s.snippets] }));
        return snippet;
      },
      async updateSnippet(id, patch) {
        const { data, error: err } = await supabase
          .from('snippets')
          .update({ ...patch, updated_at: nowIso() })
          .eq('id', id)
          .select()
          .maybeSingle();
        if (err) throw err;
        if (!data) return null;
        const snippet = data as Snippet;
        setState((s) => ({
          ...s,
          snippets: s.snippets.map((n) => (n.id === id ? snippet : n)),
        }));
        return snippet;
      },
      async deleteSnippet(id) {
        const { error: err } = await supabase.from('snippets').delete().eq('id', id);
        if (err) throw err;
        setState((s) => ({
          ...s,
          snippets: s.snippets.filter((n) => n.id !== id),
          task_resources: s.task_resources.filter(
            (r) => !(r.resource_type === 'snippet' && r.resource_id === id),
          ),
        }));
        return true;
      },
      async duplicateSnippet(id) {
        const existing = state.snippets.find((n) => n.id === id);
        if (!existing) return null;
        const uid = requireUserId(userId);
        const { data, error: err } = await supabase
          .from('snippets')
          .insert({
            user_id: uid,
            title: `${existing.title} (copy)`,
            description: existing.description,
            language: existing.language,
            code: existing.code,
            category_id: existing.category_id,
            tags: [...existing.tags],
            is_favorite: false,
          })
          .select()
          .single();
        if (err) throw err;
        const snippet = data as Snippet;
        setState((s) => ({ ...s, snippets: [snippet, ...s.snippets] }));
        return snippet;
      },

      getTask(id) {
        return state.tasks.find((t) => t.id === id);
      },
      async createTask(input) {
        const uid = requireUserId(userId);
        const status = input.status;
        const { data, error: err } = await supabase
          .from('tasks')
          .insert({
            user_id: uid,
            title: input.title,
            description: input.description,
            category_id: input.category_id,
            status,
            priority: input.priority,
            due_date: input.due_date,
            estimate_minutes: input.estimate_minutes ?? null,
            archived_at: input.archived_at ?? null,
            is_favorite: input.is_favorite ?? false,
            completed_at: status === 'done' ? nowIso() : (input.completed_at ?? null),
          })
          .select()
          .single();
        if (err) throw err;
        const task = data as Task;
        setState((s) => ({ ...s, tasks: [task, ...s.tasks] }));
        return task;
      },
      async updateTask(id, patch) {
        const prev = state.tasks.find((t) => t.id === id);
        if (!prev) return null;
        const nextStatus = (patch.status ?? prev.status) as TaskStatus;
        let completed_at =
          patch.completed_at !== undefined ? patch.completed_at : prev.completed_at;
        if (nextStatus === 'done' && prev.status !== 'done') {
          completed_at = nowIso();
        } else if (nextStatus !== 'done') {
          completed_at = null;
        }
        const { data, error: err } = await supabase
          .from('tasks')
          .update({ ...patch, completed_at, updated_at: nowIso() })
          .eq('id', id)
          .select()
          .maybeSingle();
        if (err) throw err;
        if (!data) return null;
        const task = data as Task;
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? task : t)),
        }));
        return task;
      },
      async deleteTask(id) {
        const { error: err } = await supabase.from('tasks').delete().eq('id', id);
        if (err) throw err;
        setState((s) => ({
          ...s,
          tasks: s.tasks.filter((t) => t.id !== id),
          task_resources: s.task_resources.filter((r) => r.task_id !== id),
        }));
        return true;
      },
      listTaskResources(taskId) {
        return state.task_resources.filter((r) => r.task_id === taskId);
      },
      async setTaskResources(taskId, resources) {
        const { error: delErr } = await supabase
          .from('task_resources')
          .delete()
          .eq('task_id', taskId);
        if (delErr) throw delErr;
        if (resources.length) {
          const { data, error: insErr } = await supabase
            .from('task_resources')
            .insert(
              resources.map((r) => ({
                task_id: taskId,
                resource_type: r.resource_type,
                resource_id: r.resource_id,
              })),
            )
            .select();
          if (insErr) throw insErr;
          setState((s) => ({
            ...s,
            task_resources: [
              ...s.task_resources.filter((r) => r.task_id !== taskId),
              ...((data ?? []) as TaskResource[]),
            ],
          }));
        } else {
          setState((s) => ({
            ...s,
            task_resources: s.task_resources.filter((r) => r.task_id !== taskId),
          }));
        }
      },

      async search(query) {
        const q = query.trim();
        if (!q) return [];
        const { data, error: err } = await supabase.rpc('search_developer_hub', {
          query_text: q,
        });
        if (err) throw err;
        return (data ?? []).map((row) => {
          const type = row.type as SearchResult['type'];
          const href =
            type === 'note'
              ? `/notes/${row.id}`
              : type === 'snippet'
                ? `/snippets/${row.id}`
                : `/tasks/${row.id}`;
          return {
            id: row.id,
            type,
            title: row.title,
            excerpt: row.excerpt ?? '',
            category_name: row.category_name,
            tags: row.tags,
            updated_at: row.updated_at,
            href,
          } satisfies SearchResult;
        });
      },

      exportJson() {
        return JSON.stringify(state, null, 2);
      },

      exportTasksJson(tasks) {
        const list = tasks ?? state.tasks;
        return JSON.stringify(list, null, 2);
      },

      exportTasksCsv(tasks) {
        const list = tasks ?? state.tasks;
        const escape = (v: string | number | boolean | null | undefined) => {
          const s = v == null ? '' : String(v);
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        };
        const header = [
          'id',
          'title',
          'description',
          'category_id',
          'status',
          'priority',
          'due_date',
          'estimate_minutes',
          'is_favorite',
          'archived_at',
          'completed_at',
          'created_at',
          'updated_at',
        ];
        const rows = list.map((t) =>
          [
            t.id,
            t.title,
            t.description,
            t.category_id,
            t.status,
            t.priority,
            t.due_date,
            t.estimate_minutes,
            t.is_favorite,
            t.archived_at,
            t.completed_at,
            t.created_at,
            t.updated_at,
          ]
            .map(escape)
            .join(','),
        );
        return [header.join(','), ...rows].join('\n');
      },
    };
  }, [state, loading, error, userId, refresh, seedCategoriesIfEmpty, supabase]);

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub(): HubContextValue {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within HubProvider');
  return ctx;
}

export function useHubState(): HubState {
  return useHub().state;
}
