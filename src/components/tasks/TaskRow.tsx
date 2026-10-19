'use client';

import Link from 'next/link';
import { PriorityBadge, StatusBadge } from '@/components/tasks/StatusBadge';
import RowOverflowMenu from '@/components/ui/RowOverflowMenu';
import { formatDate, isDueToday, isOverdue } from '@/lib/dates';
import type { Category, Task } from '@/types/models';

type Props = {
  task: Task;
  category?: Category;
  onToggleDone: (done: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleMyDay?: () => void;
};

function duePill(task: Task) {
  if (!task.due_date) return null;
  const overdue = isOverdue(task.due_date, false);
  const today = isDueToday(task.due_date);
  if (overdue) {
    return (
      <span className="rounded-full bg-[var(--color-danger-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-danger)]">
        Overdue · {formatDate(task.due_date)}
      </span>
    );
  }
  if (today) {
    return (
      <span className="rounded-full bg-[var(--color-warning)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--color-warning)]">
        Due today · {formatDate(task.due_date)}
      </span>
    );
  }
  return (
    <span className="text-xs text-[var(--color-muted)]">Due {formatDate(task.due_date)}</span>
  );
}

function SunIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TaskRow({
  task,
  category,
  onToggleDone,
  onDuplicate,
  onDelete,
  onToggleMyDay,
}: Props) {
  const done = task.status === 'done';
  const inMyDay = !done && (isDueToday(task.due_date) || isOverdue(task.due_date));

  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface)] ${
        done ? 'bg-[var(--color-success-soft)]/40' : ''
      }`}
    >
      <input
        type="checkbox"
        className="mt-1"
        checked={done}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onChange={(e) => onToggleDone(e.target.checked)}
      />
      <div className="min-w-0 flex-1">
        <Link href={`/tasks/${task.id}`} className="block">
          <div className={`font-medium ${done ? 'text-[var(--color-muted)]' : ''}`}>
            {task.title}
          </div>
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {done && (
            <span className="rounded-full bg-[var(--color-success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
              Done
            </span>
          )}
          {category && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${category.color}22`,
                color: category.color,
              }}
            >
              {category.name}
            </span>
          )}
          {!done && <PriorityBadge priority={task.priority} />}
          {!done && <StatusBadge status={task.status} />}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {done ? (
          <span className="px-1 text-xs text-[var(--color-muted)]">
            Completed {formatDate(task.completed_at ?? task.updated_at)}
          </span>
        ) : (
          <>
            {duePill(task)}
            {onToggleMyDay && (
              <button
                type="button"
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  inMyDay
                    ? 'text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-chip)] hover:text-[var(--color-ink)]'
                }`}
                aria-label={inMyDay ? 'Remove from My day' : 'Add to My day'}
                title={inMyDay ? 'Remove from My day' : 'Add to My day'}
                onClick={onToggleMyDay}
              >
                <SunIcon />
              </button>
            )}
          </>
        )}
        <RowOverflowMenu
          items={[
            { label: 'Edit', href: `/tasks/${task.id}` },
            { label: 'Duplicate', onClick: onDuplicate },
            { label: 'Delete…', onClick: onDelete, danger: true },
          ]}
        />
      </div>
    </li>
  );
}
