import {insertText} from './text.js'
import {shouldSkipFormatting} from './paste-keyboard-shortcut-helper.js'

export function install(el: HTMLElement): void {
  el.addEventListener('dragover', onDragover)
  el.addEventListener('drop', onDrop)
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('dragover', onDragover)
  el.removeEventListener('drop', onDrop)
  el.removeEventListener('paste', onPaste)
}

function onDrop(event: DragEvent) {
  if (event.defaultPrevented) return
  if (!(event.currentTarget instanceof HTMLTextAreaElement)) return
  const transfer = event.dataTransfer
  if (!transfer) return
  if (hasFile(transfer)) return

  const textToPaste = generateText(transfer, event.currentTarget)
  if (!textToPaste) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (field instanceof HTMLTextAreaElement) {
    insertText(field, textToPaste)
  }
}

function onDragover(event: DragEvent) {
  const transfer = event.dataTransfer
  if (transfer) transfer.dropEffect = 'copy'
}

function onPaste(event: ClipboardEvent) {
  if (event.defaultPrevented) return
  const {currentTarget: el} = event
  if (!(el instanceof HTMLTextAreaElement)) return
  if (shouldSkipFormatting(el as HTMLElement)) return

  if (!event.clipboardData) return

  const textToPaste = generateText(event.clipboardData, el)
  if (!textToPaste) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (field instanceof HTMLTextAreaElement) {
    insertText(field, textToPaste)
  }
}

function hasFile(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).indexOf('Files') >= 0
}

function columnText(column: Element): string {
  const noBreakSpace = '\u00A0'
  const text = (column.textContent || '').trim().replace(/\|/g, '\\|').replace(/\n/g, ' ')
  return text || noBreakSpace
}

function tableHeaders(row: Element): string[] {
  return Array.from(row.querySelectorAll('td, th')).map(columnText)
}

function tableMarkdown(node: Element): string {
  const rows = Array.from(node.querySelectorAll('tr'))

  const firstRow = rows.shift()
  if (!firstRow) return ''
  const headers = tableHeaders(firstRow)
  const spacers = headers.map(() => '--')
  const header = `${headers.join(' | ')}\n${spacers.join(' | ')}\n`

  const body = rows
    .map(row => {
      return Array.from(row.querySelectorAll('td')).map(columnText).join(' | ')
    })
    .join('\n')

  return `\n${header}${body}\n\n`
}

function generateText(transfer: DataTransfer, field: HTMLTextAreaElement): string | undefined {
  if (Array.from(transfer.types).indexOf('text/html') === -1) return

  const html = transfer.getData('text/html')
  if (!/<table/i.test(html)) return
  const parsedDocument = new DOMParser().parseFromString(html, 'text/html')
  const tables = parsedDocument.querySelectorAll('table')
  if (!tables.length) return
  if (Array.from(tables).some(table => table.closest('[data-paste-markdown-skip]'))) return
  const openingTables = countMatches(html, /<table(?=[\s>])/gi)
  const closingTables = countMatches(html, /<\/table\s*>/gi)
  // A single unclosed table remains unhandled, as in the original implementation.
  if (tables.length === 1 && openingTables === 1 && closingTables === 0) return
  if (tables.length !== 1 || openingTables !== 1 || closingTables !== 1) {
    const before = field.value.slice(0, field.selectionStart)
    const after = field.value.slice(field.selectionEnd)
    const plain = transfer.getData('text/plain')
    // Only separate literal text: blank lines cannot end an open fence or HTML block.
    const literal = /^[\p{L}\p{N}\p{M} \t\n]*$/u
    if (!literal.test(before) || !literal.test(after)) return html
    const content = hasCompletePlaintext(parsedDocument, plain) ? plain : html
    return (before ? '\n\n' : '') + content + (after ? '\n\n' : '')
  }
  // Leave differently cased boundaries to native paste, as upstream does.
  // eslint-disable-next-line github/unescaped-html-literal
  if (!html.includes('<table') || !html.includes('</table>')) return

  // eslint-disable-next-line github/unescaped-html-literal
  const start = html.substring(0, html.indexOf('<table'))
  const tableCloseIndex = html.lastIndexOf('</table>')
  if (!start || !tableCloseIndex) return
  const end = html.substring(tableCloseIndex + 8)

  let table = parsedDocument.querySelector('table')
  table = !table || table.closest('[data-paste-markdown-skip]') ? null : table
  if (!table) return

  const formattedTable = tableMarkdown(table)

  if (!formattedTable) return

  return [start, formattedTable, end].join('').replace(/<meta.*?>/, '')
}

function countMatches(text: string, pattern: RegExp): number {
  let count = 0
  while (pattern.exec(text)) {
    count++
    if (count > 1) break
  }
  return count
}

// Accept only simple paragraphs and independent tables. Unknown markup falls back to
// the original HTML, so an incomplete plain-text representation is never trusted.
function hasCompletePlaintext(document: Document, plain: string): boolean {
  if (!plain || plain.length > 1_000_000) return false
  if (document.createTreeWalker(document, NodeFilter.SHOW_COMMENT).nextNode()) return false
  if (document.documentElement.hasAttributes() || document.body.hasAttributes()) return false
  if (Array.from(document.head.children).some(element => element.tagName !== 'META')) return false
  const body = document.body
  if (
    Array.from(body.childNodes).some(
      node => node.nodeType === Node.TEXT_NODE && /[^\t\n\f\r ]/.test(node.textContent || ''),
    )
  )
    return false

  const blocks = plain
    .replace(/\r\n?/g, '\n')
    .replace(/^\n+|\n+$/g, '')
    .split(/\n[ \t]*\n+/)
  const elements = Array.from(body.children).filter(element => element.tagName !== 'META')
  if (blocks.length !== elements.length || elements.length > 1000) return false

  return elements.every((element, index) => {
    const block = blocks[index]
    if (element.hasAttributes()) return false
    if (element.tagName === 'P' && element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
      return (
        element.textContent === element.textContent?.trim() &&
        !hasMarkdownSyntax(element.textContent || '') &&
        block === element.textContent
      )
    }
    if (element.tagName !== 'TABLE' || element.querySelector('table, [data-paste-markdown-skip]')) return false
    if (
      Array.from(element.querySelectorAll('*')).some(
        node => node.hasAttributes() || !['THEAD', 'TBODY', 'TR', 'TD', 'TH'].includes(node.tagName),
      )
    )
      return false
    if (
      Array.from(element.querySelectorAll('table, thead, tbody, tfoot, tr')).some(node =>
        Array.from(node.childNodes).some(
          child => child.nodeType === Node.TEXT_NODE && /[^\t\n\f\r ]/.test(child.textContent || ''),
        ),
      )
    )
      return false

    const rows = Array.from(element.querySelectorAll('tr'))
    const lines = block.split('\n')
    if (!rows.length || rows.length > 1000 || lines.length !== rows.length + 1) return false
    if (lines.some(line => !/^ {0,3}\|/.test(line))) return false
    const cells = rows.map(row => Array.from(row.children))
    if (
      cells.some(
        row =>
          !row.length ||
          row.length > 100 ||
          row.some(cell => {
            return (
              !['TD', 'TH'].includes(cell.tagName) ||
              cell.childNodes.length > 1 ||
              (cell.firstChild !== null && cell.firstChild.nodeType !== Node.TEXT_NODE) ||
              cell.textContent !== cell.textContent?.trim() ||
              hasMarkdownSyntax(cell.textContent || '') ||
              /[|\n]/.test(cell.textContent || '')
            )
          }),
      )
    )
      return false
    const columnCount = cells[0].length
    if (
      cells.some(
        (row, rowIndex) =>
          row.length !== columnCount ||
          row.some(cell => cell.tagName !== (rowIndex === 0 ? 'TH' : 'TD')) ||
          (rowIndex === 0 && row.some(cell => !cell.textContent)),
      )
    )
      return false

    const parseCells = (line: string): string[] | null => {
      const trimmed = line.replace(/^[ \t]+|[ \t]+$/g, '')
      if (!/^\|.*\|$/.test(trimmed)) return null
      return trimmed
        .slice(1, -1)
        .split('|')
        .map(cell => cell.replace(/^[ \t]+|[ \t]+$/g, ''))
    }
    const header = parseCells(lines[0])
    const separator = parseCells(lines[1])
    if (!header || !separator || separator.length !== header.length || !separator.every(cell => /^-{3,}$/.test(cell)))
      return false
    return cells.every((row, rowIndex) => {
      const pasted = rowIndex === 0 ? header : parseCells(lines[rowIndex + 1])
      return (
        pasted?.length === row.length && row.every((cell, cellIndex) => cell.textContent?.trim() === pasted[cellIndex])
      )
    })
  })
}

// Only unambiguous, single-line literal text is eligible for the plain-text path.
// The prefix checks exclude headings, rules and list markers without parsing Markdown.
const simpleLiteralText = new RegExp('^[\\p{L}\\p{N}\\p{M} _.,#/-]+$', 'u')
// Dotted alphanumeric words can become GFM autolinks. Numeric decimals stay literal.
const dottedWord = new RegExp('(?:\\p{L}\\.[\\p{L}\\p{N}]|[\\p{L}\\p{N}]\\.\\p{L})', 'u')

function hasMarkdownSyntax(text: string): boolean {
  return (
    !simpleLiteralText.test(text) ||
    dottedWord.test(text) ||
    /(^|[^\p{L}\p{N}_/])#\d+/u.test(text) ||
    /^[#_-]/.test(text) ||
    /^\d{1,9}[.)](?:\s|$)/.test(text) ||
    /(^|[^a-zA-Z0-9])_|_($|[^a-zA-Z0-9])/.test(text)
  )
}
