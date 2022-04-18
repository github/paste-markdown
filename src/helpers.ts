interface CodeMirrorPasteEvent extends ClipboardEvent {
  detail: {
    originalEvent: ClipboardEvent
  }
  document: {
    replaceSelection: (text: string) => void
    getSelection: () => string
  }
  selection: Object
}

export function insertText(
  textarea: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  event?: ClipboardEvent | CustomEvent
): void {
  if (event?.type === 'codeEditor:paste') {
    (event as CodeMirrorPasteEvent).document.replaceSelection(text)
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

export function onCodeEditorPaste(event: any, callback: (event: ClipboardEvent) => void): void {
  event.clipboardData = event.detail.originalEvent.clipboardData
  event.document = event.detail.document
  event.selection = event.detail.document.getSelection()
  callback(event)
}

export function stopPropagation(event: ClipboardEvent | CodeMirrorPasteEvent): void {
  event.stopPropagation()
  event.preventDefault()
  if (event.type === 'codeEditor:paste') {
    const originalEvent = (event as CodeMirrorPasteEvent).detail.originalEvent
    originalEvent.stopPropagation()
    originalEvent.preventDefault()
  }
}

export function getSelectedText(field: HTMLTextAreaElement, event: ClipboardEvent | CustomEvent) {
  let selectedText = ''
  if (event.type === 'codeEditor:paste') {
    selectedText = (event as CodeMirrorPasteEvent).document.getSelection()
  }
  else {
    selectedText = field.value.substring(field.selectionStart, field.selectionEnd)
  }
  return selectedText
}
