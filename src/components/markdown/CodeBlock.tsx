'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

export default function CodeBlock({
  code,
  language = 'text',
  showCopy = true,
}: {
  code: string;
  language?: string;
  showCopy?: boolean;
}) {
  const [html, setHtml] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    codeToHtml(code, {
      lang: language || 'text',
      theme: 'github-dark',
    })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(async () => {
        const fallback = await codeToHtml(code, { lang: 'text', theme: 'github-dark' });
        if (!cancelled) setHtml(fallback);
      });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-800 bg-[#0f172a]">
      {showCopy && (
        <button
          type="button"
          onClick={copy}
          className="absolute right-2 top-2 z-10 rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
      {html ? (
        <div
          className="overflow-x-auto p-3 text-xs [&_pre]:m-0 [&_pre]:bg-transparent!"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 font-mono text-xs text-slate-100 whitespace-pre">
          {code}
        </pre>
      )}
    </div>
  );
}
