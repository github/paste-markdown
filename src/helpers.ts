export function insertText(textarea: HTMLInputElement | HTMLTextAreaElement, text: string): void {
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

export function onCodeEditorPaste(event: any, callback: Function) {
  event.clipboardData = event.detail.originalEvent.clipboardData
  event.currentTarget.selectionStart = event.detail.selectionStart
  event.currentTarget.selectionEnd = event.detail.selectionEnd
  callback(event)
}

export function stopPropagation(event: ClipboardEvent | CustomEvent) {
  event.stopPropagation()
  event.preventDefault()
  if (event.type === 'codeEditor:paste') {
    const originalEvent = (event as CustomEvent).detail.originalEvent
    originalEvent.stopPropagation()
    originalEvent.preventDefault()
  }
}
