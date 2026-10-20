/**
 * Preset swatches for category pickers.
 * Avoids status/urgency hues (danger red, due-today amber, in-progress blue).
 */
export const CATEGORY_COLORS = [
  '#f97316', // orange — Bug Fix–friendly, distinct from overdue red
  '#ec4899', // pink — Meetings
  '#8b5cf6', // violet — Feature
  '#0ea5e9', // sky — Development
  '#14b8a6', // teal — BA Support
  '#84cc16', // lime — Testing
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const DEFAULT_CATEGORY_COLOR: CategoryColor = CATEGORY_COLORS[3]; // sky

/** Suggested defaults for the six task categories. */
export const TASK_CATEGORY_COLORS: Record<string, string> = {
  Development: '#0ea5e9',
  Feature: '#8b5cf6',
  'BA Support': '#14b8a6',
  'Bug Fix': '#f97316',
  Testing: '#84cc16',
  Meetings: '#ec4899',
};
