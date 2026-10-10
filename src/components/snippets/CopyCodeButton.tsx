'use client';

import { useState } from 'react';

export default function CopyCodeButton({
  code,
  label = 'Copy code',
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className="btn-secondary" onClick={copy}>
      {copied ? 'Copied' : label}
    </button>
  );
}
