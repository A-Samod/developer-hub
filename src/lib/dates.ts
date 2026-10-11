export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return '—';
  const d = new Date(isoOrDate.length === 10 ? `${isoOrDate}T12:00:00` : isoOrDate);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverdue(dueDate: string | null, completed = false): boolean {
  if (!dueDate || completed) return false;
  return dueDate < todayDate();
}

export function isDueToday(dueDate: string | null): boolean {
  return dueDate === todayDate();
}

export function isUpcoming(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate > todayDate();
}

export function priorityRank(priority: string): number {
  switch (priority) {
    case 'urgent':
      return 0;
    case 'high':
      return 1;
    case 'medium':
      return 2;
    default:
      return 3;
  }
}

export function tomorrowDate(): string {
  return addDays(todayDate(), 1);
}

export function formatEstimate(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function estimateToParts(minutes: number | null | undefined): {
  hours: number;
  minutes: number;
} {
  if (minutes == null || minutes < 0) return { hours: 0, minutes: 0 };
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

export function partsToEstimate(hours: number, minutes: number): number | null {
  const h = Number.isFinite(hours) ? Math.max(0, Math.floor(hours)) : 0;
  const m = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
  const total = h * 60 + m;
  return total > 0 ? total : null;
}
