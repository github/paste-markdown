/* @flow strict */

import {insertText} from './text'

export function install(el: Element) {
  el.addEventListener('dragover', onDragover)
  el.addEventListener('drop', onDrop)
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: Element) {
  el.removeEventListener('dragover', onDragover)
  el.removeEventListener('drop', onDrop)
  el.removeEventListener('paste', onPaste)
}

function onDrop(event: DragEvent) {
  const transfer = event.dataTransfer
  if (!transfer) return

  if (hasFile(transfer)) return
  if (!hasLink(transfer)) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return

  for (const link of links(transfer).map(linkify)) {
    insertText(field, link)
  }
}

function onDragover(event: DragEvent) {
  const transfer = event.dataTransfer
  if (transfer) transfer.dropEffect = 'link'
}

function onPaste(event: ClipboardEvent) {
  const transfer = event.clipboardData
  if (!transfer || !hasLink(transfer)) return

  event.stopPropagation()
  event.preventDefault()

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return
  for (const link of links(transfer).map(linkify)) {
    insertText(field, link)
  }
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

function links(transfer: DataTransfer): Array<string> {
  return (transfer.getData('text/uri-list') || '').split('\r\n')
}

function isImageLink(url: string): boolean {
  const ext = url
    .split('.')
    .pop()
    .toLowerCase()
  return ['gif', 'png', 'jpg', 'jpeg'].indexOf(ext) > -1
}
