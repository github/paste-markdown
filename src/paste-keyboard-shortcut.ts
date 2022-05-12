type UMap = WeakMap<HTMLElement, boolean>
export class PasteKeyBoardShortcut {
  map: UMap

  constructor() {
    this.map = new WeakMap()
    this.handleUnformatted = this.handleUnformatted.bind(this)
    this.isUnformatted = this.isUnformatted.bind(this)
  }

  handleUnformatted(event: KeyboardEvent): void {
    const {currentTarget: el} = event
    if (event.code === 'KeyV' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
      this.map.set(el as HTMLElement, true)
    }
  }

  isUnformatted(el: HTMLElement): boolean {
    const isUnformattedState = this.map.get(el) ?? false
    this.map.delete(el)

    return isUnformattedState
  }
}
