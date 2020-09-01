/* @flow strict */

import {insertText} from './text'

export function install(el: HTMLElement): void {
  el.addEventListener('dragover', onDragover)
  el.addEventListener('drop', onDrop)
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('dragover', onDragover)
  el.removeEventListener('drop', onDrop)
  el.removeEventListener('paste', onPaste)
}

function onDrop(event: DragEvent) {
  const transfer = event.dataTransfer
  if (!transfer) return

  if (hasFile(transfer)) return
  if (!hasLink(transfer)) return

  const links = extractLinks(transfer)
  if (!links.some(isImageLink)) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return
  insertText(field, links.map(linkify).join(''))
}

function onDragover(event: DragEvent) {
  const transfer = event.dataTransfer
  if (transfer) transfer.dropEffect = 'link'
}

function onPaste(event: ClipboardEvent) {
  const transfer = event.clipboardData
  if (!transfer || !hasLink(transfer)) return

  const links = extractLinks(transfer)
  if (!links.some(isImageLink)) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return
  insertText(field, links.map(linkify).join(''))
}

function linkify(link: string): string {
  return isImageLink(link) ? `\n![](${link})\n` : link
}

function hasFile(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).indexOf('Files') >= 0
}

function hasLink(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).indexOf('text/uri-list') >= 0
}

function extractLinks(transfer: DataTransfer): string[] {
  return (transfer.getData('text/uri-list') || '').split('\r\n')
}

const IMAGE_RE = /\.(gif|png|jpe?g)$/i

function isImageLink(url: string): boolean {
  return IMAGE_RE.test(url)
}
