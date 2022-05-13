import {insertText} from './text'
import {shouldSkipformatting} from './paste-keyboard-shortcut-helper'

export function install(el: HTMLElement): void {
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
}

function onPaste(event: ClipboardEvent) {
  const {currentTarget: el} = event
  if (shouldSkipformatting(el as HTMLElement)) return

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
