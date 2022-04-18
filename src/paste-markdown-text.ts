import {insertText, onCodeEditorPaste, stopPropagation} from './helpers'

export function install(el: HTMLElement): void {
  el.addEventListener('paste', onPaste)
  el.addEventListener('codeEditor:paste', event => onCodeEditorPaste(event, onPaste))
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
  el.removeEventListener('codeEditor:paste', event => onCodeEditorPaste(event, onPaste))
}

function onPaste(event: ClipboardEvent) {
  const transfer = event.clipboardData
  if (!transfer || !hasMarkdown(transfer)) return

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return

  const text = transfer.getData('text/x-gfm')
  if (!text) return

  stopPropagation(event)

  insertText(field, text, event)
}

function hasMarkdown(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).indexOf('text/x-gfm') >= 0
}
