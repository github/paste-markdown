import {Unformatted} from './handlers'
import {insertText} from './text'

const unformatted = new Unformatted()

export function install(el: HTMLElement): void {
  el.addEventListener('keydown', unformatted.handleUnformatted)
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('keydown', unformatted.handleUnformatted)
  el.removeEventListener('paste', onPaste)
}

function onPaste(event: ClipboardEvent) {
  const {currentTarget: el} = event
  if (unformatted.isUnformatted(el as HTMLElement)) return

  const transfer = event.clipboardData
  if (!transfer || !hasMarkdown(transfer)) return

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return

  const text = transfer.getData('text/x-gfm')
  if (!text) return

  event.stopPropagation()
  event.preventDefault()

  insertText(field, text)
}

function hasMarkdown(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).indexOf('text/x-gfm') >= 0
}
