import {insertText} from './text'

export function install(el: HTMLElement): void {
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
}

type MarkdownTransformer = (element: HTMLElement | HTMLAnchorElement, args: string[]) => string

function onPaste(event: ClipboardEvent) {
  const transfer = event.clipboardData
  // if there is no clipboard data, or
  // if there is no html content in the clipboard, or
  // if the browser has made an "improved URL for pasting", return
  // See https://support.microsoft.com/en-gb/microsoft-edge/improved-copy-and-paste-of-urls-in-microsoft-edge-d3bd3956-603a-0033-1fbc-9588a30645b4 for more
  if (!transfer || !hasHTML(transfer) || hasLinkPreview(transfer)) return

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return

  // Get the plaintext and html version of clipboard contents
  let text = transfer.getData('text/plain')
  const textHTML = transfer.getData('text/html')
  if (!textHTML) return

  text = text.trim()
  if (!text) return

  // Generate DOM tree from HTML string
  const parser = new DOMParser()
  const doc = parser.parseFromString(textHTML, 'text/html')

  const a = doc.getElementsByTagName('a')
  const markdown = transform(a, text, linkify as MarkdownTransformer)

  // If no changes made by transforming
  if (markdown === text) return

  event.stopPropagation()
  event.preventDefault()

  insertText(field, markdown)
}

// Build a markdown string from a DOM tree and plaintext
function transform(
  elements: HTMLCollectionOf<HTMLElement>,
  text: string,
  transformer: MarkdownTransformer,
  ...args: string[]
): string {
  const markdownParts = []
  for (const element of elements) {
    const textContent = element.textContent || ''
    const {part, index} = trimAfter(text, textContent)
    markdownParts.push(part.replace(textContent, transformer(element, args)))
    text = text.slice(index)
  }
  markdownParts.push(text)
  return markdownParts.join('')
}

// Trim text at index of last character of the first occurrence of "search" and
// return a new string with the substring until the index
//  Example: trimAfter('Hello world', 'world') => {part: 'Hello world', index: 11}
//  Example: trimAfter('Hello world', 'bananas') => {part: '', index: -1}
function trimAfter(text: string, search = ''): {part: string; index: number} {
  let index = text.indexOf(search)
  if (index === -1) return {part: '', index}

  index += search.length

  return {
    part: text.substring(0, index),
    index
  }
}

function hasHTML(transfer: DataTransfer): boolean {
  return transfer.types.includes('text/html')
}

function hasLinkPreview(transfer) {
  return transfer.types.includes('text/link-preview');
}

function linkify(element: HTMLAnchorElement): string {
  return `[${element.textContent}](${element.href})`
}
