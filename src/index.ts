import {OptionConfig, PASTE_AS_PLAIN_TEXT_ATTRIBUTE} from './option-config'
import {install as installHTML, uninstall as uninstallHTML} from './paste-markdown-html'
import {install as installImageLink, uninstall as uninstallImageLink} from './paste-markdown-image-link'
import {install as installLink, uninstall as uninstallLink} from './paste-markdown-link'
import {
  installAround as installSkipFormatting,
  uninstall as uninstallSkipFormatting
} from './paste-keyboard-shortcut-helper'
import {install as installTable, uninstall as uninstallTable} from './paste-markdown-table'
import {install as installText, uninstall as uninstallText} from './paste-markdown-text'

interface Subscription {
  unsubscribe: () => void
}

function subscribe(el: HTMLElement, optionConfig?: OptionConfig): Subscription {
  markElementWithConfigIfNeeded(el, optionConfig)

  installSkipFormatting(el, installTable, installImageLink, installLink, installText, installHTML)
  return {
    unsubscribe: () => {
      uninstallSkipFormatting(el)
      uninstallTable(el)
      uninstallHTML(el)
      uninstallImageLink(el)
      uninstallLink(el)
      uninstallText(el)
    }
  }
}

function markElementWithConfigIfNeeded(el: HTMLElement, optionConfig?: OptionConfig) {
  // eslint-disable-next-line no-console
  console.log(optionConfig)

  if (optionConfig?.pasteAsPlainText) {
    // eslint-disable-next-line no-console
    console.log(optionConfig?.pasteAsPlainText, 'HERE')

    el.setAttribute(PASTE_AS_PLAIN_TEXT_ATTRIBUTE, 'true')
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
