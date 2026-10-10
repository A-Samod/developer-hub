export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type CategoryEntityType = 'note' | 'snippet' | 'task';
export type ResourceType = 'note' | 'snippet';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  entity_type: CategoryEntityType;
  color: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content_md: string;
  category_id: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  category_id: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  notes: string;
  is_completed: boolean;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category_id: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskResource {
  id: string;
  task_id: string;
  resource_type: ResourceType;
  resource_id: string;
}

export interface SearchResult {
  id: string;
  type: 'note' | 'snippet' | 'todo' | 'task';
  title: string;
  excerpt: string;
  category_name?: string | null;
  tags?: string[] | null;
  updated_at: string;
  href: string;
}

export interface HubState {
  categories: Category[];
  notes: Note[];
  snippets: Snippet[];
  todos: Todo[];
  tasks: Task[];
  task_resources: TaskResource[];
}

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
export const TASK_STATUSES: TaskStatus[] = [
  'todo',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
];

export const SNIPPET_LANGUAGES = [
  'javascript',
  'typescript',
  'sql',
  'shell',
  'graphql',
  'terraform',
  'python',
  'json',
] as const;
