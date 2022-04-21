import {insertText} from './text'

export function install(el: HTMLElement, {signal}: {signal?: AbortSignal} = {}): void {
  el.addEventListener('paste', onPaste, {signal})
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
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

  const selectedText = field.value.substring(field.selectionStart, field.selectionEnd)
  if (!selectedText.length) return
  // Prevent linkification when replacing an URL
  // Trim whitespace in case whitespace is selected by mistake or by intention
  if (isURL(selectedText.trim())) return

  event.stopPropagation()
  event.preventDefault()

  insertText(field, linkify(selectedText, text))
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
