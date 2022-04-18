import {insertText, onCodeEditorPaste, stopPropagation} from './helpers'

export function install(el: HTMLElement): void {
  el.addEventListener('paste', onPaste)
  el.addEventListener('codeEditor:paste', event => onCodeEditorPaste(event, onPaste))
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
  el.removeEventListener('codeEditor:paste', event => onCodeEditorPaste(event, onPaste))
}

type MarkdownTransformer = (element: HTMLElement | HTMLAnchorElement, args: string[]) => string

function onPaste(event: ClipboardEvent) {
  const transfer = event.clipboardData
  // if there is no clipboard data, or
  // if there is no html content in the clipboard, return
  if (!transfer || !hasHTML(transfer)) return

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return

  // Get the plaintext and html version of clipboard contents
  let text = transfer.getData('text/plain')
  const textHTML = transfer.getData('text/html')
  // Replace Unicode equivalent of "&nbsp" with a space
  const textHTMLClean = textHTML.replace(/\u00A0/g, ' ')
  if (!textHTML) return

  text = text.trim()
  if (!text) return

  // Generate DOM tree from HTML string
  const parser = new DOMParser()
  const doc = parser.parseFromString(textHTMLClean, 'text/html')

  const a = doc.getElementsByTagName('a')
  const markdown = transform(a, text, linkify as MarkdownTransformer)

  // If no changes made by transforming
  if (markdown === text) return

  stopPropagation(event)

  insertText(field, markdown, event)
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
    if (index >= 0) {
      markdownParts.push(part.replace(textContent, transformer(element, args)))
      text = text.slice(index)
    }
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

// Makes markdown link from a link element, avoiding special GitHub links
function linkify(element: HTMLAnchorElement): string {
  const label = element.textContent || ''
  const url = element.href || ''
  let markdown = ''

  // Don't linkify user mentions like "@octocat"
  if (isUserMention(element)) {
    markdown = label
    // Don't linkify things like "#123" or commit comparisons
  } else if (isSpecialLink(element) || areEqualLinks(url, label)) {
    markdown = url
    // Otherwise, make a markdown link
  } else {
    markdown = `[${label}](${url})`
  }

  return markdown
}

// Special GitHub links have either a hover card or certain class name
function isSpecialLink(link: HTMLAnchorElement): boolean {
  return (
    link.className.indexOf('commit-link') >= 0 ||
    (!!link.getAttribute('data-hovercard-type') && link.getAttribute('data-hovercard-type') !== 'user')
  )
}

// Browsers sometimes copy a stray "/" at the end of a link
// Also, unequal string casing shouldn't disqualify links from being equal
function areEqualLinks(link1: string, link2: string) {
  link1 = link1.slice(-1) === '/' ? link1.slice(0, -1) : link1
  link2 = link2.slice(-1) === '/' ? link2.slice(0, -1) : link2
  return link1.toLowerCase() === link2.toLowerCase()
}

// User mentions have a "@" and a hovercard attribute of type "user"
function isUserMention(link: HTMLAnchorElement): boolean {
  return link.textContent?.slice(0, 1) === '@' && link.getAttribute('data-hovercard-type') === 'user'
}
