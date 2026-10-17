'use client';

import { indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useMemo, useState } from 'react';
import { getResolvedTheme, subscribeTheme } from '@/lib/theme';

function languageExtension(language: string) {
  switch (language) {
    case 'javascript':
    case 'typescript':
    case 'graphql':
      return javascript({ typescript: language === 'typescript' || language === 'graphql' });
    case 'python':
      return python();
    case 'sql':
      return sql();
    case 'json':
      return json();
    case 'html':
      return html();
    case 'css':
      return css();
    case 'markdown':
    case 'shell':
    case 'terraform':
      return markdown();
    default:
      return [];
  }
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  minHeight?: string;
};

export default function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  minHeight = '280px',
}: Props) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(getResolvedTheme() === 'dark');
    return subscribeTheme(() => setDark(getResolvedTheme() === 'dark'));
  }, []);

  const extensions = useMemo(
    () => [
      lineNumbers(),
      keymap.of([indentWithTab]),
      languageExtension(language),
      EditorView.theme({
        '&': { fontSize: '13px' },
        '.cm-content': { fontFamily: 'var(--font-mono), ui-monospace, monospace' },
        '.cm-scroller': { overflow: 'auto' },
      }),
      ...(dark ? [oneDark] : []),
    ],
    [language, dark],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
      <CodeMirror
        value={value}
        height={minHeight}
        theme={dark ? 'dark' : 'light'}
        extensions={extensions}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          bracketMatching: true,
          autocompletion: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}
