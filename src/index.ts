import {install as installHTML, uninstall as uninstallHTML} from './paste-markdown-html'
import {install as installImageLink, uninstall as uninstallImageLink} from './paste-markdown-image-link'
import {install as installLink, uninstall as uninstallLink} from './paste-markdown-link'
import {
  installAround as installSkipFormatting,
  uninstall as uninstallSkipFormatting,
} from './paste-keyboard-shortcut-helper'
import {install as installTable, uninstall as uninstallTable} from './paste-markdown-table'
import {install as installText, uninstall as uninstallText} from './paste-markdown-text'
import {OptionConfig} from './option-config'

interface Subscription {
  unsubscribe: () => void
}

function subscribe(el: HTMLElement, optionConfig?: OptionConfig): Subscription {
  installSkipFormatting(el, [installTable, installImageLink, installLink, installText, installHTML], optionConfig)
  return {
    unsubscribe: () => {
      uninstallSkipFormatting(el)
      uninstallTable(el)
      uninstallHTML(el)
      uninstallImageLink(el)
      uninstallLink(el)
      uninstallText(el)
    },
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
  uninstallText,
}
