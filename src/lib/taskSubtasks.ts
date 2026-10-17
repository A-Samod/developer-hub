export type TaskSubtask = {
  id: string;
  title: string;
  done: boolean;
};

const MARKER_START = '<!--dh-subtasks:';
const MARKER_END = '-->';

export function parseTaskDescription(raw: string): {
  body: string;
  subtasks: TaskSubtask[];
} {
  const start = raw.lastIndexOf(MARKER_START);
  if (start === -1) {
    return { body: raw, subtasks: [] };
  }
  const jsonStart = start + MARKER_START.length;
  const end = raw.indexOf(MARKER_END, jsonStart);
  if (end === -1) {
    return { body: raw, subtasks: [] };
  }
  const json = raw.slice(jsonStart, end).trim();
  let subtasks: TaskSubtask[] = [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      subtasks = parsed
        .filter(
          (item): item is TaskSubtask =>
            !!item &&
            typeof item === 'object' &&
            typeof (item as TaskSubtask).id === 'string' &&
            typeof (item as TaskSubtask).title === 'string',
        )
        .map((item) => ({
          id: item.id,
          title: item.title,
          done: Boolean(item.done),
        }));
    }
  } catch {
    subtasks = [];
  }
  const body = raw.slice(0, start).replace(/\n+$/, '');
  return { body, subtasks };
}

export function serializeTaskDescription(body: string, subtasks: TaskSubtask[]): string {
  const trimmed = body.replace(/\n+$/, '');
  if (subtasks.length === 0) return trimmed;
  return `${trimmed}\n\n${MARKER_START}${JSON.stringify(subtasks)}${MARKER_END}`;
}

export function newSubtaskId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
