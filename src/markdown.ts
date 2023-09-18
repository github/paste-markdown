export function markdownLink(text: string, url: string): string {
  return `[${text}](${url})`
}

export function markdownImage(url: string, altText: string): string {
  return `!${markdownLink(altText, url)}}`
}

export function markdownTable(headerCells: string[], ...rows: string[][]): string {
  return `${headerCells.join(' | ')}
${headerCells.map(() => '--').join(' | ')}
${rows.map(row => row.join(' | ')).join('\n')}`
}
