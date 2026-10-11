'use client';

import {
  formatPriority,
  formatTaskStatus,
  type Priority,
  type TaskStatus,
} from '@/types/models';

const priorityColors: Record<Priority, string> = {
  low: 'var(--color-priority-low)',
  medium: 'var(--color-priority-medium)',
  high: 'var(--color-priority-high)',
  urgent: 'var(--color-priority-urgent)',
};

const statusColors: Record<TaskStatus, string> = {
  todo: 'var(--color-status-todo)',
  in_progress: 'var(--color-status-in_progress)',
  blocked: 'var(--color-status-blocked)',
  done: 'var(--color-status-done)',
  cancelled: 'var(--color-status-cancelled)',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const color = priorityColors[priority];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `color-mix(in srgb, ${color} 16%, white)`, color }}
    >
      {formatPriority(priority)}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const color = statusColors[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `color-mix(in srgb, ${color} 16%, white)`, color }}
    >
      {formatTaskStatus(status)}
    </span>
  );
}

export function TagChip({ tag }: { tag: string }) {
  return (
    <span className="rounded bg-[var(--color-chip)] px-1.5 py-0.5 text-xs text-[var(--color-chip-text)]">
      {tag}
    </span>
  );
}
