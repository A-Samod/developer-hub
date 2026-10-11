'use client';

import { useState } from 'react';

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
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className={`btn-secondary ${className}`.trim()} onClick={copy}>
      {copied ? 'Copied' : label}
    </button>
  );
}
