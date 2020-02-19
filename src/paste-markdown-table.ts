/* @flow strict */

import {insertText} from './text'

export function install(el: HTMLElement) {
  el.addEventListener('dragover', onDragover)
  el.addEventListener('drop', onDrop)
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement) {
  el.removeEventListener('dragover', onDragover)
  el.removeEventListener('drop', onDrop)
  el.removeEventListener('paste', onPaste)
}

function onDrop(event: DragEvent) {
  const transfer = event.dataTransfer
  if (!transfer) return

  if (hasFile(transfer)) return

  const table = hasTable(transfer)
  if (!table) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (field instanceof HTMLTextAreaElement) {
    insertText(field, tableMarkdown(table))
  }
}

function onDragover(event: DragEvent) {
  const transfer = event.dataTransfer
  if (transfer) transfer.dropEffect = 'copy'
}

function onPaste(event: ClipboardEvent) {
  if (!event.clipboardData) return

  const table = hasTable(event.clipboardData)
  if (!table) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (field instanceof HTMLTextAreaElement) {
    insertText(field, tableMarkdown(table))
  }
}

function hasFile(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).indexOf('Files') >= 0
}

function columnText(column: Element): string {
  const noBreakSpace = '\u00A0'
  const text = (column.textContent || '')
    .trim()
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
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
      return Array.from(row.querySelectorAll('td'))
        .map(columnText)
        .join(' | ')
    })
    .join('\n')

  return `\n${header}${body}\n\n`
}

function parseTable(html: string): HTMLElement | null {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.querySelector('table')
}

function hasTable(transfer: DataTransfer): HTMLElement | void {
  if (Array.from(transfer.types).indexOf('text/html') === -1) return

  const html = transfer.getData('text/html')
  if (!/<table/i.test(html)) return

  const table = parseTable(html)
  if (!table) return

  // Prevent pasting layout table
  if (table.closest('[data-layout-table]')) return

  return table
}
