'use client';

import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

export function useLoadMore<T>(items: T[], filterKey: string, pageSize = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [filterKey, pageSize]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  const hasMore = visibleCount < items.length;
  const remaining = Math.max(0, items.length - visibleCount);

  function loadMore() {
    setVisibleCount((n) => Math.min(n + pageSize, items.length));
  }

  return {
    visibleItems,
    hasMore,
    remaining,
    loadMore,
    total: items.length,
    visibleCount: Math.min(visibleCount, items.length),
  };
}
