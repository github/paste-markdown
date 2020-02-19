export function insertText(textarea: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const beginning = textarea.value.substring(0, textarea.selectionStart || 0)
  const remaining = textarea.value.substring(textarea.selectionEnd || 0)

  const newline = beginning.length === 0 || beginning.match(/\n$/) ? '' : '\n'
  const textBeforeCursor = beginning + newline + text

  textarea.value = textBeforeCursor + remaining
  textarea.selectionStart = textBeforeCursor.length
  textarea.selectionEnd = textarea.selectionStart

  textarea.dispatchEvent(
    new CustomEvent('change', {
      bubbles: true,
      cancelable: false
    })
  )

  textarea.focus()
}
