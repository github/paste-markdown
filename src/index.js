/* @flow strict */

import {install as installLink, uninstall as uninstallLink} from './paste-markdown-image-link'
import {install as installTable, uninstall as uninstallTable} from './paste-markdown-table'

type Subscription = {|
  unsubscribe: () => void
|}

export default function subscribe(el: Element): Subscription {
  installTable(el)
  installLink(el)

  return {
    unsubscribe: () => {
      uninstallTable(el)
      uninstallLink(el)
    }
  }
}
