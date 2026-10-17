'use client';

type Props = {
  hasMore: boolean;
  remaining: number;
  total: number;
  visibleCount: number;
  onLoadMore: () => void;
  itemLabel?: string;
};

function pluralLabel(total: number, itemLabel: string) {
  if (total === 1) {
    return itemLabel.endsWith('s') ? itemLabel.slice(0, -1) : itemLabel;
  }
  return itemLabel;
}

export default function LoadMoreButton({
  hasMore,
  remaining,
  total,
  visibleCount,
  onLoadMore,
  itemLabel = 'items',
}: Props) {
  if (total === 0) return null;

  if (!hasMore) {
    return (
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        {total} {pluralLabel(total, itemLabel)}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
      <p className="text-sm text-[var(--color-muted)]">
        Showing {visibleCount} of {total} {itemLabel}
      </p>
      <button type="button" className="btn-secondary" onClick={onLoadMore}>
        Load more{remaining > 0 ? ` (${remaining})` : ''}
      </button>
    </div>
  );
}
