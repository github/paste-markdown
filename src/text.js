/* @flow strict */

export function insertText(textarea: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const point = textarea.selectionEnd
  const beginning = textarea.value.substring(0, point)
  const remaining = textarea.value.substring(point)
  const newline = textarea.value === '' || beginning.match(/\n$/) ? '' : '\n'

  textarea.value = beginning + newline + text + remaining
  textarea.selectionStart = point + text.length
  textarea.selectionEnd = point + text.length

  textarea.dispatchEvent(
    new CustomEvent('change', {
      bubbles: true,
      cancelable: false
    })
  )

  textarea.focus()
}
