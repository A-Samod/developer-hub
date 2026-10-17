'use client';

import Link from 'next/link';
import CodeBlock from '@/components/markdown/CodeBlock';
import CopyCodeButton from '@/components/snippets/CopyCodeButton';
import RowOverflowMenu from '@/components/ui/RowOverflowMenu';
import { codePreviewLines } from '@/lib/textPreview';
import type { Category, Snippet } from '@/types/models';
import { formatSnippetLanguage } from '@/types/models';

type Props = {
  snippet: Snippet;
  category?: Category;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export default function SnippetCard({
  snippet,
  category,
  onToggleFavorite,
  onDuplicate,
  onDelete,
}: Props) {
  const preview = codePreviewLines(snippet.code, 8);
  const languageLabel = formatSnippetLanguage(snippet.language);
  const categoryDuplicatesLanguage =
    !!category &&
    category.name.trim().toLowerCase() === languageLabel.trim().toLowerCase();
  const showCategory = !!category && !categoryDuplicatesLanguage;

  return (
    <article className="panel flex flex-col overflow-hidden">
      <div className="flex items-start gap-2 px-4 pt-4">
        <Link href={`/snippets/${snippet.id}`} className="min-w-0 flex-1">
          <h3 className="font-semibold tracking-tight">{snippet.title}</h3>
        </Link>
        <button
          type="button"
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] transition ${
            snippet.is_favorite
              ? 'text-[var(--color-favorite)]'
              : 'text-[var(--color-muted)] hover:bg-[var(--color-chip)] hover:text-[var(--color-favorite)]'
          }`}
          aria-label={snippet.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={onToggleFavorite}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={snippet.is_favorite ? 'currentColor' : 'none'} aria-hidden>
            <path
              d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6L12 17.3 6.7 20.1l1-6L3.4 9.9l6-.9L12 3.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <RowOverflowMenu
          items={[
            { label: 'Edit', href: `/snippets/${snippet.id}` },
            { label: 'Duplicate', onClick: onDuplicate },
            { label: 'Delete…', onClick: onDelete, danger: true },
          ]}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 px-4">
        <span className="chip">{languageLabel}</span>
        {showCategory && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-chip)] px-2 py-0.5 text-xs font-medium text-[var(--color-chip-text)]"
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            {category.name}
          </span>
        )}
        {snippet.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-3 px-4">
        <CodeBlock code={preview} language={snippet.language} showCopy={false} />
      </div>

      <div className="mt-auto flex justify-end px-4 py-3">
        <CopyCodeButton code={snippet.code} label="Copy" className="min-h-8 px-3 py-1.5 text-xs" />
      </div>
    </article>
  );
}
