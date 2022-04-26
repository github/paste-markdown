import {insertText, onCodeEditorPaste, stopPropagation} from './helpers'

export function install(el: HTMLElement): void {
  el.addEventListener('dragover', onDragover)
  el.addEventListener('drop', onDrop)
  el.addEventListener('paste', onPaste)
  el.addEventListener('codeEditor:paste', event => onCodeEditorPaste(event, onPaste))
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('dragover', onDragover)
  el.removeEventListener('drop', onDrop)
  el.removeEventListener('paste', onPaste)
  el.removeEventListener('codeEditor:paste', event => onCodeEditorPaste(event, onPaste))
}

function onDrop(event: DragEvent) {
  const transfer = event.dataTransfer
  if (!transfer) return
  if (hasFile(transfer)) return

  const textToPaste = generateText(transfer)
  if (!textToPaste) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (field instanceof HTMLTextAreaElement) {
    insertText(field, textToPaste, event)
  }
}

function onDragover(event: DragEvent) {
  const transfer = event.dataTransfer
  if (transfer) transfer.dropEffect = 'copy'
}

function onPaste(event: ClipboardEvent) {
  if (!event.clipboardData) return

  const textToPaste = generateText(event.clipboardData)
  if (!textToPaste) return

  stopPropagation(event)

  const field = event.currentTarget
  if (field instanceof HTMLTextAreaElement) {
    insertText(field, textToPaste, event)
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

function generateText(transfer: DataTransfer): string | undefined {
  if (Array.from(transfer.types).indexOf('text/html') === -1) return

  const html = transfer.getData('text/html')
  if (!/<table/i.test(html)) return

  const parser = new DOMParser()
  const parsedDocument = parser.parseFromString(html, 'text/html')

  let table = parsedDocument.querySelector('table')
  table = !table || table.closest('[data-paste-markdown-skip]') ? null : table
  if (!table) return

  const formattedTable = tableMarkdown(table)

  return html.replace(/<meta.*?>/, '').replace(/<table[.\S\s]*<\/table>/, `\n${formattedTable}`)
}
