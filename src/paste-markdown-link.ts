import {getSelectedText, insertText, onCodeEditorPaste, stopPropagation} from './helpers'

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
  if (!transfer || !hasPlainText(transfer)) return

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return

  const text = transfer.getData('text/plain')
  if (!text) return
  if (!isURL(text)) return
  if (isWithinLink(field)) return

  const selectedText = getSelectedText(field, event)
  if (!selectedText.length) return
  // Prevent linkification when replacing an URL
  // Trim whitespace in case whitespace is selected by mistake or by intention
  if (isURL(selectedText.trim())) return

  stopPropagation(event)

  insertText(field, linkify(selectedText, text), event)
}

function hasPlainText(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).includes('text/plain')
}

function isWithinLink(textarea: HTMLTextAreaElement): boolean {
  const selectionStart = textarea.selectionStart || 0

  if (selectionStart > 1) {
    const previousChars = textarea.value.substring(selectionStart - 2, selectionStart)
    return previousChars === ']('
  } else {
    return false
  }
}

function linkify(selectedText: string, text: string): string {
  return `[${selectedText}](${text})`
}

function isURL(url: string): boolean {
  return /^https?:\/\//i.test(url)
}
