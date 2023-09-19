import {
  markdownBold,
  markdownInlineCode,
  markdownInsertion,
  markdownItalic,
  markdownKeyboard,
  markdownLink,
  markdownStrikethrough,
  markdownSubscript,
  markdownSuperscript
} from './markdown'
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

  const textHTMLClean = normalizeHtmlWhitespace(textHTML)
  if (!textHTML) return

  plaintext = plaintext.trim()
  if (!plaintext) return

  // Generate DOM tree from HTML string
  const parser = new DOMParser()
  const doc = parser.parseFromString(textHTMLClean, 'text/html')

  // Replace all line-break elements with line break characters that will appear in `textContent`
  for (const br of doc.querySelectorAll('br')) br.replaceWith('\n')
  doc.normalize()

  const markdown = convertToMarkdown(plaintext, doc)

  // If no changes made by transforming
  if (markdown === plaintext) return

  event.stopPropagation()
  event.preventDefault()

  insertText(field, markdown)
}

function convertToMarkdown(plaintext: string, htmlDocument: Document): string {
  const nodes = iterateNodeTree(
    htmlDocument,
    htmlDocument.body,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    node => {
      // We don't supported nested Markdown nodes for now (ie, bold inside of links), so we only want supported nodes
      // and not their descendants. FILTER_REJECT will skip the entire subtree, while FILTER_SKIP will only skip the node.
      if (isChildOfSupportedMarkdownNode(node)) return NodeFilter.FILTER_REJECT
      else if (isSupportedMarkdownNode(node)) return NodeFilter.FILTER_ACCEPT
      else return NodeFilter.FILTER_SKIP
    }
  )

  let markdown = plaintext
  let markdownIndex = 0

  let nodeCount = 0
  const NODE_LIMIT = 10000

  for (const node of nodes) {
    if (++nodeCount > NODE_LIMIT) return plaintext

    const text = node.textContent?.trim() ?? ''

    // Find the index where "text" is found in "markdown" _after_ "markdownIgnoreBeforeIndex"
    const markdownFoundIndex = markdown.indexOf(text, markdownIndex)
    const nodeToMarkdown = getNodeToMarkdown(node)

    if (markdownFoundIndex >= 0 && nodeToMarkdown !== undefined) {
      const nodeMarkdown = nodeToMarkdown()

      // Transform the slice of the plain text into the new markdown text
      markdown = markdown.slice(0, markdownFoundIndex) + nodeMarkdown + markdown.slice(markdownFoundIndex + text.length)
      markdownIndex = markdownFoundIndex + nodeMarkdown.length
    }
  }

  return markdown
}

/**
 * Returns a function that converts the passed node to a Markdown string, or `undefined` if the passed node is not a
 * supported Markdown node. Can be used to determine if a node is supported without having to transform it.
 */
function getNodeToMarkdown(node: Node): (() => string) | void {
  // Don't transform empty nodes
  if (node instanceof Text || isEmptyString(node.textContent ?? '')) return () => node.textContent ?? ''

  if (node instanceof HTMLAnchorElement) return () => linkify(node)

  switch (node.nodeName) {
    case 'STRONG':
      return () => simpleInlineTag(node, markdownBold)
    case 'EM':
      return () => simpleInlineTag(node, markdownItalic)
    case 'CODE':
      return () => simpleInlineTag(node, markdownInlineCode)
    case 'KBD':
      return () => simpleInlineTag(node, markdownKeyboard)
    case 'DEL':
      return () => simpleInlineTag(node, markdownStrikethrough)
    case 'INS':
      return () => simpleInlineTag(node, markdownInsertion)
    case 'SUP':
      return () => simpleInlineTag(node, markdownSuperscript)
    case 'SUB':
      return () => simpleInlineTag(node, markdownSubscript)
  }
}

function isSupportedMarkdownNode(node: Node): boolean {
  return getNodeToMarkdown(node) !== undefined
}

/** True if the node is a direct child of a supported Node. */
function isChildOfSupportedMarkdownNode({parentNode}: Node): boolean {
  return parentNode !== null && isSupportedMarkdownNode(parentNode)
}

/** `TreeWalker` is not iterable, so this wrapper makes it usable in `for...of` loops. */
function* iterateNodeTree(document: Document, root: Node, whatToShow?: number, filter?: NodeFilter | null) {
  const tree = document.createTreeWalker(root, whatToShow, filter)

  let node
  while ((node = tree.nextNode())) yield node
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

function hasHTML(transfer: DataTransfer): boolean {
  return transfer.types.includes('text/html')
}

function stripLineBreaks(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').trim()
}

/** Collapse whitespace in HTML to normalize it with the plain-text representation. Also convert nbsp into regular space. */
function normalizeHtmlWhitespace(text: string): string {
  // The problem is that the HTML is not actually rendered onto the page, so the browser does not do the normal
  // whitespace normalizing. This means textContent and innerText both just return the raw text of the node, ignoring
  // `br` tags. So to be able to compare the parsed HTML with the plain-text variant, we need to make the whitespace
  // in the HTML match what it would look like when rendered.

  // We don't need to handle block breaks like p tags since we will work across those as separate nodes.
  return (
    text
      // Collapse whitespace that would be collapsed if rendered
      .replace(/[\t\n\r ]+/g, ' ')
      // Replace non-breaking space (nbsp) with regular space
      .replace(/[\u00A0\uC2A0]/g, ' ')
      .trim()
  )
}

// Makes markdown link from a link element, avoiding special GitHub links
function linkify(element: HTMLAnchorElement): string {
  // Inline tags can have hard linebreaks in HTML, but not in Markdown, so we must collapse them to one line
  const label = stripLineBreaks(element.textContent ?? '')

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
    markdown = markdownLink(label, url)
  }

  return markdown
}

function simpleInlineTag(element: Node, markdownBuilder: (text: string) => string): string {
  return markdownBuilder(stripLineBreaks(element.textContent ?? ''))
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
