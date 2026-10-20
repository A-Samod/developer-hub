'use client';

type Props = {
  name: string;
  color: string;
};

/** Neutral chip with a colored dot — shared by Notes and Tasks. */
export default function CategoryChip({ name, color }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-chip)] px-2 py-0.5 text-xs font-medium text-[var(--color-chip-text)]">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {name}
    </span>
  );
}
