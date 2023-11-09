import {insertText} from './text'
import {shouldSkipFormatting} from './paste-keyboard-shortcut-helper'

export function install(el: HTMLElement): void {
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
}

function onPaste(event: ClipboardEvent) {
  const transfer = event.clipboardData
  const {currentTarget: el} = event
  if (shouldSkipFormatting(el as HTMLElement)) return
  // if there is no clipboard data, or
  // if there is no html content in the clipboard, return
  if (!transfer || !hasHTML(transfer)) return

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return

  if (isWithinUserMention(field)) {
    return
  }

  // Get the plaintext and html version of clipboard contents
  let plaintext = transfer.getData('text/plain')
  const textHTML = transfer.getData('text/html')
  // Replace Unicode equivalent of "&nbsp" with a space
  const textHTMLClean = textHTML.replace(/\u00A0/g, ' ').replace(/\uC2A0/g, ' ')
  if (!textHTML) return

  plaintext = plaintext.trim()
  if (!plaintext) return

  // Generate DOM tree from HTML string
  const parser = new DOMParser()
  const doc = parser.parseFromString(textHTMLClean, 'text/html')
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, node =>
    node.parentNode && isLink(node.parentNode) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  )

  const markdown = convertToMarkdown(plaintext, walker)

  // If no changes made by transforming
  if (markdown === plaintext) return

  event.stopPropagation()
  event.preventDefault()

  insertText(field, markdown)
}

function convertToMarkdown(plaintext: string, walker: TreeWalker): string {
  let currentNode = walker.firstChild()
  let markdown = plaintext
  let markdownIgnoreBeforeIndex = 0
  let index = 0
  const NODE_LIMIT = 10000

  // Walk through the DOM tree
  while (currentNode && index < NODE_LIMIT) {
    index++
    const text = isLink(currentNode)
      ? (currentNode.textContent || '').replace(/[\t\n\r ]+/g, ' ')
      : (currentNode.firstChild as Text)?.wholeText || ''

    // No need to transform whitespace
    if (isEmptyString(text)) {
      currentNode = walker.nextNode()
      continue
    }

    // Find the index where "text" is found in "markdown" _after_ "markdownIgnoreBeforeIndex"
    const markdownFoundIndex = markdown.indexOf(text, markdownIgnoreBeforeIndex)

    if (markdownFoundIndex >= 0) {
      if (isLink(currentNode)) {
        const markdownLink = linkify(currentNode, text)
        // Transform 'example link plus more text' into 'example [link](example link) plus more text'
        // Method: 'example [link](example link) plus more text' = 'example ' + '[link](example link)' + ' plus more text'
        markdown =
          markdown.slice(0, markdownFoundIndex) + markdownLink + markdown.slice(markdownFoundIndex + text.length)
        markdownIgnoreBeforeIndex = markdownFoundIndex + markdownLink.length
      } else {
        markdownIgnoreBeforeIndex = markdownFoundIndex + text.length
      }
    }

    currentNode = walker.nextNode()
  }

  // Unless we hit the node limit, we should have processed all nodes
  return index === NODE_LIMIT ? plaintext : markdown
}

function isWithinUserMention(textarea: HTMLTextAreaElement): boolean {
  const selectionStart = textarea.selectionStart || 0
  if (selectionStart === 0) {
    return false
  }

  const previousChar = textarea.value.substring(selectionStart - 1, selectionStart)
  return previousChar === '@'
}

function isEmptyString(text: string): boolean {
  return !text || text?.trim().length === 0
}

function isLink(node: Node): node is HTMLAnchorElement {
  return (node as HTMLElement).tagName?.toLowerCase() === 'a' && (node as HTMLElement).hasAttribute('href')
}

function hasHTML(transfer: DataTransfer): boolean {
  return transfer.types.includes('text/html')
}

// Makes markdown link from a link element, avoiding special GitHub links
function linkify(element: HTMLAnchorElement, label: string): string {
  const url = element.href || ''
  let markdown = ''

  // Don't linkify user mentions like "@octocat"
  if (isUserMention(element) || isTeamMention(element)) {
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

// Team mentions have a "@" and a hovercard attribute of type "team"
function isTeamMention(link: HTMLAnchorElement): boolean {
  return link.textContent?.slice(0, 1) === '@' && link.getAttribute('data-hovercard-type') === 'team'
}
