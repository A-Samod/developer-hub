import type { Category } from '@/types/models';

export function compareCategories(a: Category, b: Category): number {
  const posA = a.position ?? 0;
  const posB = b.position ?? 0;
  if (posA !== posB) return posA - posB;
  return a.name.localeCompare(b.name);
}

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort(compareCategories);
}
