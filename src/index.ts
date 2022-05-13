import {install as installHTML, uninstall as uninstallHTML} from './paste-markdown-html'
import {install as installImageLink, uninstall as uninstallImageLink} from './paste-markdown-image-link'
import {install as installLink, uninstall as uninstallLink} from './paste-markdown-link'
import {
  installBefore as installSkipFormatting,
  installAfter as installSkipFormattingPaste,
  uninstall as uninstallSkipFormatting
} from './paste-keyboard-shortcut-helper'
import {install as installTable, uninstall as uninstallTable} from './paste-markdown-table'
import {install as installText, uninstall as uninstallText} from './paste-markdown-text'

interface Subscription {
  unsubscribe: () => void
}

// Inorder to intercept default paste behavior correctly using keyboard shorcuts, the
// order of skip formatting handler functions here does matter.
function subscribe(el: HTMLElement): Subscription {
  installSkipFormatting(el)
  installTable(el)
  installImageLink(el)
  installLink(el)
  installText(el)
  installHTML(el)
  installSkipFormattingPaste(el)

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
