type UMap = WeakMap<HTMLElement, boolean>
export class PasteKeyBoardShortcut {
  map: UMap

  constructor() {
    this.map = new WeakMap()
    this.handleSkipFormatting = this.handleSkipFormatting.bind(this)
    this.shouldSkipFormatting = this.shouldSkipFormatting.bind(this)
  }

  handleSkipFormatting(event: KeyboardEvent): void {
    const {currentTarget: el} = event
    const isSkipFormattingKeys = event.code === 'KeyV' && (event.ctrlKey || event.metaKey) && event.shiftKey

    if (isSkipFormattingKeys || (isSkipFormattingKeys && event.altKey)) {
      this.map.set(el as HTMLElement, true)
    }
  }

  shouldSkipFormatting(el: HTMLElement): boolean {
    const isUnformattedState = this.map.get(el) ?? false
    this.map.delete(el)

    return isUnformattedState
  }
}
