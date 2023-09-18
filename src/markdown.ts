export function markdownLink(text: string, url: string): string {
  return `[${text}](${url})`
}

export function markdownImage(url: string, altText: string): string {
  return `!${markdownLink(altText, url)}`
}

export function markdownTable(headerCells: string[], ...rows: string[][]): string {
  return `${headerCells.join(' | ')}
${headerCells.map(() => '--').join(' | ')}
${rows.map(row => row.join(' | ')).join('\n')}`
}

export function markdownBold(text: string): string {
  return `**${text}**`
}

export function markdownItalic(text: string): string {
  return `_${text}_`
}

export function markdownInlineCode(text: string): string {
  return `\`${text}\``
}

export function markdownKeyboard(text: string): string {
  // eslint-disable-next-line github/unescaped-html-literal
  return `<kbd>${text}</kbd>`
}

export function markdownStrikethrough(text: string): string {
  return `~~${text}~~`
}

export function markdownInsertion(text: string): string {
  // eslint-disable-next-line github/unescaped-html-literal
  return `<ins>${text}</ins>`
}

export function markdownSuperscript(text: string): string {
  // eslint-disable-next-line github/unescaped-html-literal
  return `<sup>${text}</sup>`
}

export function markdownSubscript(text: string): string {
  // eslint-disable-next-line github/unescaped-html-literal
  return `<sub>${text}</sub>`
}
