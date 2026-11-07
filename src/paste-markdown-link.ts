import {OptionConfig} from './option-config.js'
import {insertText} from './text.js'
import {shouldSkipFormatting} from './paste-keyboard-shortcut-helper.js'

const pasteLinkAsPlainTextOverSelectedTextMap = new WeakMap<HTMLElement, boolean>()

export function install(el: HTMLElement, optionConfig?: OptionConfig): void {
  pasteLinkAsPlainTextOverSelectedTextMap.set(el, optionConfig?.defaultPlainTextPaste?.urlLinks === true)
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
}

function onPaste(event: ClipboardEvent) {
  const {currentTarget: el} = event
  const element = el as HTMLElement
  const shouldPasteAsPlainText = pasteLinkAsPlainTextOverSelectedTextMap.get(element) ?? false
  const shouldSkipDefaultBehavior = shouldSkipFormatting(element)

  if (
    (!shouldPasteAsPlainText && shouldSkipDefaultBehavior) ||
    (shouldPasteAsPlainText && !shouldSkipDefaultBehavior)
  ) {
    return
  }

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

  insertText(field, linkify(selectedText, text.trim()))
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
  try {
    //eslint-disable-next-line no-restricted-syntax
    const parsedURL = new URL(url)
    return removeTrailingSlash(parsedURL.href).trim() === removeTrailingSlash(url).trim()
  } catch {
    return false
  }
}
function removeTrailingSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, url.length - 1) : url
}
