export function insertText(textarea: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const before = textarea.value.slice(0, textarea.selectionStart || undefined)
  const after = textarea.value.slice(textarea.selectionEnd || undefined)

  let canInsertText = true

  textarea.contentEditable = 'true'
  try {
    canInsertText = document.execCommand('insertText', false, text)
  } catch (error) {
    canInsertText = false
  }
  textarea.contentEditable = 'false'

  if (canInsertText && !textarea.value.slice(0, textarea.selectionStart || undefined).endsWith(text)) {
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
    textarea.dispatchEvent(new CustomEvent('input', {bubbles: true, cancelable: true}))
  }
}
