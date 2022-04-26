interface CodeMirrorDocument {
  replaceSelection(text: string): void
  getSelection(): string
}

export interface CodeMirrorPasteEvent extends ClipboardEvent {
  detail: {
    originalEvent: ClipboardEvent
    document: CodeMirrorDocument
  }
  document: CodeMirrorDocument
  selection: string
}

export function insertText(
  textarea: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  event: ClipboardEvent | CodeMirrorPasteEvent
): void {
  if (isCodeEditorEvent(event)) {
    event.document.replaceSelection(text)
    return
  }
  const before = textarea.value.slice(0, textarea.selectionStart ?? undefined)
  const after = textarea.value.slice(textarea.selectionEnd ?? undefined)

  let canInsertText = true

  textarea.contentEditable = 'true'
  try {
    canInsertText = document.execCommand('insertText', false, text)
  } catch (error) {
    canInsertText = false
  }
  textarea.contentEditable = 'false'

  if (canInsertText && !textarea.value.slice(0, textarea.selectionStart ?? undefined).endsWith(text)) {
    canInsertText = false
  }

  if (!canInsertText) {
    try {
      document.execCommand('ms-beginUndoUnit')
    } catch (e) {
      // Do nothing.
    }
    textarea.value = before + text + after
    try {
      document.execCommand('ms-endUndoUnit')
    } catch (e) {
      // Do nothing.
    }
    textarea.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
  }
}

export function onCodeEditorPaste(
  event: CodeMirrorPasteEvent,
  callback: (event: CodeMirrorPasteEvent | ClipboardEvent) => void
): void {
  const syntheticEvent: CodeMirrorPasteEvent = {
    ...event,
    clipboardData: event.detail.originalEvent.clipboardData,
    document: event.detail.document,
    selection: event.detail.document.getSelection()
  }
  callback(syntheticEvent)
}

export function stopPropagation(event: ClipboardEvent | CodeMirrorPasteEvent): void {
  event.stopPropagation()
  event.preventDefault()
  if (isCodeEditorEvent(event)) {
    const originalEvent = (event as CodeMirrorPasteEvent).detail.originalEvent
    originalEvent.stopPropagation()
    originalEvent.preventDefault()
  }
}

export function getSelectedText(field: HTMLTextAreaElement, event: ClipboardEvent | CustomEvent): string {
  let selectedText = ''
  if (isCodeEditorEvent(event)) {
    selectedText = (event as CodeMirrorPasteEvent).document.getSelection()
  } else {
    selectedText = field.value.substring(field.selectionStart, field.selectionEnd)
  }
  return selectedText
}

function isCodeEditorEvent(event: ClipboardEvent | CustomEvent): event is CodeMirrorPasteEvent {
  return event.type === 'codeEditor:paste'
}
