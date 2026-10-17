'use client';

import type { RefObject } from 'react';
import { applyMarkdownLinePrefix, applyMarkdownWrap } from '@/lib/markdownInsert';

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
};

type Tool = {
  label: string;
  title: string;
  run: () => void;
};

export default function MarkdownToolbar({ textareaRef, value, onChange }: Props) {
  function apply(
    mutator: (
      value: string,
      start: number,
      end: number,
    ) => { value: string; selectionStart: number; selectionEnd: number },
  ) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = mutator(value, start, end);
    onChange(next.value);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  }

  const tools: Tool[] = [
    {
      label: 'B',
      title: 'Bold',
      run: () => apply((v, s, e) => applyMarkdownWrap(v, s, e, '**', '**', 'bold')),
    },
    {
      label: 'I',
      title: 'Italic',
      run: () => apply((v, s, e) => applyMarkdownWrap(v, s, e, '_', '_', 'italic')),
    },
    {
      label: '</>',
      title: 'Inline code',
      run: () => apply((v, s, e) => applyMarkdownWrap(v, s, e, '`', '`', 'code')),
    },
    {
      label: '•',
      title: 'Bullet list',
      run: () => apply((v, s, e) => applyMarkdownLinePrefix(v, s, e, '- ')),
    },
    {
      label: 'Link',
      title: 'Link',
      run: () =>
        apply((v, s, e) => {
          const selected = v.slice(s, e) || 'text';
          const inserted = `[${selected}](url)`;
          const next = v.slice(0, s) + inserted + v.slice(e);
          const urlStart = s + selected.length + 3;
          return {
            value: next,
            selectionStart: urlStart,
            selectionEnd: urlStart + 3,
          };
        }),
    },
    {
      label: 'H',
      title: 'Heading',
      run: () => apply((v, s, e) => applyMarkdownLinePrefix(v, s, e, '## ')),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Markdown">
      {tools.map((tool) => (
        <button
          key={tool.title}
          type="button"
          title={tool.title}
          aria-label={tool.title}
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-chip)] hover:text-[var(--color-ink)]"
          onClick={tool.run}
        >
          {tool.label === 'I' ? <span className="italic">I</span> : tool.label}
        </button>
      ))}
    </div>
  );
}
