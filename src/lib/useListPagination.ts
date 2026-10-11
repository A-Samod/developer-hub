'use client';

import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export function useListPagination<T>(items: T[], filterKey: string) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, items.length);
  const pagedItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [filterKey, pageSize]);

  return {
    pageSize,
    setPageSize,
    currentPage,
    setPage,
    totalPages,
    pageStart,
    pageEnd,
    pagedItems,
    total: items.length,
  };
}
