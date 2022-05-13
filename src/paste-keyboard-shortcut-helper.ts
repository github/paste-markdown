const skipformattingMap = new WeakMap<HTMLElement, boolean>()

function setSkipFormattingFlag(event: KeyboardEvent): void {
  const {currentTarget: el} = event
  const isSkipFormattingKeys = event.code === 'KeyV' && (event.ctrlKey || event.metaKey) && event.shiftKey

  // Supports Cmd+Shift+V (Chrome) / Cmd+Shift+Opt+V (Safari, Firefox and Edge) to mimic paste and match style shortcut on MacOS.
  if (isSkipFormattingKeys || (isSkipFormattingKeys && event.altKey)) {
    skipformattingMap.set(el as HTMLElement, true)
  }
}

function unsetSkipFormattedFlag(event: ClipboardEvent): void {
  const {currentTarget: el} = event
  skipformattingMap.delete(el as HTMLElement)
}

export function shouldSkipformatting(el: HTMLElement): boolean {
  const shouldSkipformattingState = skipformattingMap.get(el) ?? false

  return shouldSkipformattingState
}

export function installBefore(el: HTMLElement): void {
  el.addEventListener('keydown', setSkipFormattingFlag)
}

export function installAfter(el: HTMLElement): void {
  el.addEventListener('paste', unsetSkipFormattedFlag)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('keydown', setSkipFormattingFlag)
  el.removeEventListener('paste', unsetSkipFormattedFlag)
}
