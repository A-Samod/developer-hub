export type TasksDefaultView =
  | 'my_day'
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'archived'
  | 'all'
  | 'by_category';

export interface DashboardBlocks {
  quickAdd: boolean;
  pinned: boolean;
  today: boolean;
  overdue: boolean;
  recentNotes: boolean;
}

export interface AppPreferences {
  tasksDefaultView: TasksDefaultView;
  dashboardBlocks: DashboardBlocks;
}

export const PREFS_KEY = 'developer-hub.prefs';

export const DEFAULT_PREFERENCES: AppPreferences = {
  tasksDefaultView: 'my_day',
  dashboardBlocks: {
    quickAdd: true,
    pinned: true,
    today: true,
    overdue: true,
    recentNotes: true,
  },
};

const VIEW_KEYS: TasksDefaultView[] = [
  'my_day',
  'upcoming',
  'in_progress',
  'completed',
  'archived',
  'all',
  'by_category',
];

function normalize(raw: unknown): AppPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFERENCES };
  const obj = raw as Partial<AppPreferences>;
  const view = VIEW_KEYS.includes(obj.tasksDefaultView as TasksDefaultView)
    ? (obj.tasksDefaultView as TasksDefaultView)
    : DEFAULT_PREFERENCES.tasksDefaultView;
  const blocks = (obj.dashboardBlocks ?? {}) as Partial<DashboardBlocks>;
  return {
    tasksDefaultView: view,
    dashboardBlocks: {
      quickAdd: blocks.quickAdd ?? true,
      pinned: blocks.pinned ?? true,
      today: blocks.today ?? true,
      overdue: blocks.overdue ?? true,
      recentNotes: blocks.recentNotes ?? true,
    },
  };
}

export function getPreferences(): AppPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return normalize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function setPreferences(prefs: AppPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('developer-hub:prefs', { detail: prefs }));
}

export function updatePreferences(patch: Partial<AppPreferences>): AppPreferences {
  const next = normalize({ ...getPreferences(), ...patch });
  setPreferences(next);
  return next;
}

export function subscribePreferences(listener: (prefs: AppPreferences) => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === PREFS_KEY) listener(getPreferences());
  };
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<AppPreferences>).detail;
    listener(detail ? normalize(detail) : getPreferences());
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('developer-hub:prefs', onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('developer-hub:prefs', onCustom);
  };
}
