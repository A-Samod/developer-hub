import { addDays, calendarDateInAppTz, completedDayLabel, todayDate } from '@/lib/dates';
import type { Task } from '@/types/models';

export type CompletedDayGroup = {
  key: string;
  label: string;
  tasks: Task[];
};

export function sortByCompletedAtDesc(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aAt = a.completed_at ?? a.updated_at;
    const bAt = b.completed_at ?? b.updated_at;
    return bAt.localeCompare(aAt);
  });
}

export function groupTasksByCompletedDay(tasks: Task[]): CompletedDayGroup[] {
  const sorted = sortByCompletedAtDesc(tasks);
  const map = new Map<string, Task[]>();
  for (const task of sorted) {
    const day = calendarDateInAppTz(task.completed_at ?? task.updated_at);
    const list = map.get(day);
    if (list) list.push(task);
    else map.set(day, [task]);
  }
  return [...map.entries()].map(([key, groupTasks]) => ({
    key,
    label: completedDayLabel(key),
    tasks: groupTasks,
  }));
}

export type CompletedBucket = 'all' | 'today' | 'yesterday' | 'week';

export function matchesCompletedBucket(
  task: Task,
  bucket: CompletedBucket,
  completedOn: string,
): boolean {
  const day = calendarDateInAppTz(task.completed_at ?? task.updated_at);
  if (completedOn) return day === completedOn;
  const today = todayDate();
  if (bucket === 'today') return day === today;
  if (bucket === 'yesterday') return day === addDays(today, -1);
  if (bucket === 'week') return day >= addDays(today, -6) && day <= today;
  return true;
}
