'use client';

import SelectDropdown from '@/components/ui/SelectDropdown';
import { PAGE_SIZE_OPTIONS } from '@/lib/useListPagination';

type Props = {
  pageStart: number;
  pageEnd: number;
  total: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPageLabel?: string;
};

export default function ListPagination({
  pageStart,
  pageEnd,
  total,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  onPageChange,
  perPageLabel = 'Per page',
}: Props) {
  return (
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-[var(--color-muted)]">
          Showing {pageStart}–{pageEnd} of {total}
        </p>
        <SelectDropdown
          aria-label={perPageLabel}
          className="w-[8.5rem]"
          value={String(pageSize)}
          onChange={(v) => onPageSizeChange(Number(v))}
          options={PAGE_SIZE_OPTIONS.map((n) => ({
            value: String(n),
            label: `${n} per page`,
          }))}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          Previous
        </button>
        <span className="text-sm text-[var(--color-muted)]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className="btn-secondary"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
