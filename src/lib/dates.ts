/** App calendar / display timezone (Sri Lanka). */
export const APP_TIMEZONE = 'Asia/Colombo';

export function nowIso(): string {
  return new Date().toISOString();
}

/** Today's calendar date in Sri Lanka as YYYY-MM-DD. */
export function todayDate(): string {
  return calendarDateInAppTz(nowIso());
}

/** Calendar date YYYY-MM-DD in Sri Lanka for an ISO timestamp or date. */
export function calendarDateInAppTz(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }
  if (isoOrDate.length === 10) return isoOrDate;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoOrDate));
}

/** Label for a completion day: Today / Yesterday / formatted date. */
export function completedDayLabel(day: string): string {
  const today = todayDate();
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  return formatDate(day);
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return '—';
  if (isoOrDate.length === 10) {
    const [y, m, d] = isoOrDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    return date.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return new Date(isoOrDate).toLocaleDateString('en-GB', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Weekday + short date in Sri Lanka, e.g. "Saturday, 17 Oct 2026". */
export function formatWeekdayDate(isoOrDate?: string | null): string {
  if (!isoOrDate) {
    return new Date().toLocaleDateString('en-GB', {
      timeZone: APP_TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  if (isoOrDate.length === 10) {
    const [y, m, d] = isoOrDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    return date.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return new Date(isoOrDate).toLocaleDateString('en-GB', {
    timeZone: APP_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso.length === 10 ? `${iso}T12:00:00+05:30` : iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const abs = Math.abs(diffMs);
  const sec = Math.round(abs / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day} day${day === 1 ? '' : 's'} ago`;
  return formatDate(iso);
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
