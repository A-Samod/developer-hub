'use client';

import { forwardRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  'aria-label'?: string;
}

const MarkdownEditor = forwardRef<HTMLTextAreaElement, Props>(function MarkdownEditor(
  {
    value,
    onChange,
    placeholder = 'Write Markdown…',
    rows = 16,
    className = '',
    'aria-label': ariaLabel,
  },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`input min-h-[200px] resize-y font-mono ${className}`}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      aria-label={ariaLabel}
    />
  );
});

export default MarkdownEditor;
