/** Strip light markdown and collapse whitespace for list previews. */
export function stripMarkdownPreview(md: string, maxLen = 120): string {
  let s = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1).trimEnd()}…`;
}

export function codePreviewLines(code: string, maxLines = 8): string {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const slice = lines.slice(0, maxLines);
  const joined = slice.join('\n');
  return lines.length > maxLines ? `${joined}\n…` : joined;
}
