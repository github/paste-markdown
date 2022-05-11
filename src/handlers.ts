const unformatted = new WeakMap<HTMLElement, boolean>()

export function handleUnformatted(event: KeyboardEvent): void {
  const {currentTarget: el} = event
  if (event.code === 'KeyV' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
    unformatted.set(el as HTMLElement, true)
  }
}

export function isUnformatted(el: HTMLElement): boolean {
  const isUnformattedState = unformatted.get(el) ?? false
  unformatted.delete(el)

  return isUnformattedState
}
