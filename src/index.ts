import {install as installHTML, uninstall as uninstallHTML} from './paste-markdown-html'
import {install as installImageLink, uninstall as uninstallImageLink} from './paste-markdown-image-link'
import {install as installLink, uninstall as uninstallLink} from './paste-markdown-link'
import {install as installTable, uninstall as uninstallTable} from './paste-markdown-table'
import {install as installText, uninstall as uninstallText} from './paste-markdown-text'

interface Subscription {
  unsubscribe: () => void
}

function subscribe(el: HTMLElement, {signal}: {signal?: AbortSignal} = {}): Subscription {
  installTable(el, {signal})
  installImageLink(el, {signal})
  installLink(el, {signal})
  installText(el, {signal})
  installHTML(el, {signal})

  return {
    unsubscribe: () => {
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
