import {install as installHTML, uninstall as uninstallHTML} from './paste-markdown-html'
import {install as installImageLink, uninstall as uninstallImageLink} from './paste-markdown-image-link'
import {install as installLink, uninstall as uninstallLink} from './paste-markdown-link'
import {install as installTable, uninstall as uninstallTable} from './paste-markdown-table'
import {install as installText, uninstall as uninstallText} from './paste-markdown-text'
import {
  installBefore as installUnformatted,
  installAfter as installUnformattedAfter,
  uninstall as uninstallUnformatted
} from './handlers'

interface Subscription {
  unsubscribe: () => void
}

function subscribe(el: HTMLElement): Subscription {
  installUnformatted(el)
  installTable(el)
  installImageLink(el)
  installLink(el)
  installText(el)
  installHTML(el)
  installUnformattedAfter(el)

  return {
    unsubscribe: () => {
      uninstallUnformatted(el)
      uninstallTable(el)
      uninstallHTML(el)
      uninstallImageLink(el)
      uninstallLink(el)
      uninstallText(el)
    }
  }
}

export {
  subscribe,
  installHTML,
  installImageLink,
  installLink,
  installTable,
  installText,
  uninstallHTML,
  uninstallImageLink,
  uninstallTable,
  uninstallLink,
  uninstallText
}
