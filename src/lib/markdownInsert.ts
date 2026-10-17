/** Insert or wrap text around the current selection in a textarea. */
export function applyMarkdownWrap(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string = before,
  placeholder = 'text',
): { value: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(selectionStart, selectionEnd);
  const inner = selected || placeholder;
  const next = value.slice(0, selectionStart) + before + inner + after + value.slice(selectionEnd);
  if (selected) {
    return {
      value: next,
      selectionStart: selectionStart + before.length,
      selectionEnd: selectionStart + before.length + selected.length,
    };
  }
  return {
    value: next,
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionStart + before.length + placeholder.length,
  };
}

export function applyMarkdownLinePrefix(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
): { value: string; selectionStart: number; selectionEnd: number } {
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const lineEndIdx = value.indexOf('\n', selectionEnd);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split('\n').map((line) =>
    line.startsWith(prefix) ? line : `${prefix}${line || 'item'}`,
  );
  const replaced = lines.join('\n');
  const next = value.slice(0, lineStart) + replaced + value.slice(lineEnd);
  return {
    value: next,
    selectionStart: lineStart,
    selectionEnd: lineStart + replaced.length,
  };
}

export function countMarkdownWords(md: string): number {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_\-~|]/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}
