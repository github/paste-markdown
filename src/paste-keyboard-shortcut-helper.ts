import {OptionConfig} from './option-config'

const skipFormattingMap = new WeakMap<HTMLElement, boolean>()

function setSkipFormattingFlag(event: KeyboardEvent): void {
  const {currentTarget: el} = event
  const isSkipFormattingKeys = event.code === 'KeyV' && (event.ctrlKey || event.metaKey) && event.shiftKey

  // Supports Cmd+Shift+V (Chrome) / Cmd+Shift+Opt+V (Safari, Firefox and Edge) to mimic paste and match style shortcut on MacOS.
  if (isSkipFormattingKeys || (isSkipFormattingKeys && event.altKey)) {
    skipFormattingMap.set(el as HTMLElement, true)
  }
}

function unsetSkipFormattedFlag(event: ClipboardEvent): void {
  const {currentTarget: el} = event
  skipFormattingMap.delete(el as HTMLElement)
}

export function shouldSkipFormatting(el: HTMLElement): boolean {
  const shouldSkipFormattingState = skipFormattingMap.get(el) ?? false

  return shouldSkipFormattingState
}

export function installAround(
  el: HTMLElement,
  installCallbacks: Array<(el: HTMLElement, optionConfig?: OptionConfig) => void>,
  optionConfig?: OptionConfig
): void {
  el.addEventListener('keydown', setSkipFormattingFlag)

  for (const installCallback of installCallbacks) {
    installCallback(el, optionConfig)
  }

  el.addEventListener('paste', unsetSkipFormattedFlag)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('keydown', setSkipFormattingFlag)
  el.removeEventListener('paste', unsetSkipFormattedFlag)
}
