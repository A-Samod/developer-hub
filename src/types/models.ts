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

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category_id: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  estimate_minutes: number | null;
  archived_at: string | null;
  is_favorite: boolean;
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
  type: 'note' | 'snippet' | 'task';
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

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
};

export function formatPriority(priority: string): string {
  if (priority in PRIORITY_LABELS) {
    return PRIORITY_LABELS[priority as Priority];
  }
  if (!priority) return priority;
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function formatTaskStatus(status: string): string {
  if (status in TASK_STATUS_LABELS) {
    return TASK_STATUS_LABELS[status as TaskStatus];
  }
  if (!status) return status;
  const spaced = status.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

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

export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];

export const SNIPPET_LANGUAGE_LABELS: Record<SnippetLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  sql: 'SQL',
  shell: 'Shell',
  graphql: 'GraphQL',
  terraform: 'Terraform',
  python: 'Python',
  json: 'JSON',
};

export function formatSnippetLanguage(language: string): string {
  if (language in SNIPPET_LANGUAGE_LABELS) {
    return SNIPPET_LANGUAGE_LABELS[language as SnippetLanguage];
  }
  if (!language) return language;
  return language.charAt(0).toUpperCase() + language.slice(1);
}
