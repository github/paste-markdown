import {install as installImageLink, uninstall as uninstallImageLink} from './paste-markdown-image-link'
import {install as installLink, uninstall as uninstallLink} from './paste-markdown-link'
import {install as installTable, uninstall as uninstallTable} from './paste-markdown-table'
import {install as installText, uninstall as uninstallText} from './paste-markdown-text'

interface Subscription {
  unsubscribe: () => void
}

export default function subscribe(el: HTMLElement): Subscription {
  installTable(el)
  installImageLink(el)
  installLink(el)
  installText(el)

  return {
    unsubscribe: () => {
      uninstallTable(el)
      uninstallImageLink(el)
      uninstallLink(el)
      uninstallText(el)
    }
  }
}
