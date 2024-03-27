import {install as installHTML, uninstall as uninstallHTML} from './paste-markdown-html.js'
import {install as installImageLink, uninstall as uninstallImageLink} from './paste-markdown-image-link.js'
import {install as installLink, uninstall as uninstallLink} from './paste-markdown-link.js'
import {
  installAround as installSkipFormatting,
  uninstall as uninstallSkipFormatting,
} from './paste-keyboard-shortcut-helper.js'
import {install as installTable, uninstall as uninstallTable} from './paste-markdown-table.js'
import {install as installText, uninstall as uninstallText} from './paste-markdown-text.js'
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
