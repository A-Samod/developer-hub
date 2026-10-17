'use client';

import { useState } from 'react';
import { toastSuccess } from '@/lib/toast';

export default function CopyCodeButton({
  code,
  label = 'Copy code',
  className = '',
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toastSuccess('Copied');
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (copied) {
    return (
      <span
        className={`inline-flex min-h-8 items-center px-3 py-1.5 text-xs font-medium text-[var(--color-success)] ${className}`.trim()}
        aria-live="polite"
      >
        Copied ✓
      </span>
    );
  }

  return (
    <button type="button" className={`btn-secondary ${className}`.trim()} onClick={() => void copy()}>
      {label}
    </button>
  );
}
