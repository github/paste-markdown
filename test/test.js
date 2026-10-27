import {subscribe, installTable, uninstallTable} from '../src/index.ts'
import {assert} from '@open-wc/testing'

const tableHtml = `
  <table>
    <thead><tr><th>name</th><th>origin</th></tr></thead>
    <tbody>
      <tr><td>hubot</td><td>github</td></tr>
      <tr><td>bender</td><td>futurama</td></tr>
    </tbody>
  </table>
`

const tableMarkdown = 'name | origin\n-- | --\nhubot | github\nbender | futurama'

describe('paste-markdown', function () {
  describe('installed on textarea', function () {
    let subscription
    let textarea
    beforeEach(function () {
      document.body.innerHTML = `
        <textarea data-paste-markdown></textarea>
      `

      textarea = document.querySelector('textarea[data-paste-markdown]')
      subscription = subscribe(textarea)
    })

    afterEach(function () {
      subscription.unsubscribe()
      document.body.innerHTML = ''
    })

    it('turns image uris into markdown', async function () {
      paste(textarea, {'text/uri-list': 'https://github.com/github.png\r\nhttps://github.com/hubot.png'})
      assert.include(textarea.value, '![](https://github.com/github.png)\n\n![](https://github.com/hubot.png)')
    })

    it('turns pasted urls on selected text into markdown links', function () {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      paste(textarea, {'text/plain': 'https://github.com'})
      assert.equal(textarea.value, 'The examples can be found [here](https://github.com).')
    })

    it('turns pasted urls on selected text into markdown links if pasteLinkAsPlainTextOverSelectedText is false', function () {
      subscription = subscribeWithOptionConfig(subscription, textarea, false)

      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      paste(textarea, {'text/plain': 'https://github.com'})
      assert.equal(textarea.value, 'The examples can be found [here](https://github.com).')
    })

    it('turns pasted urls on selected text into markdown links if pasteLinkAsPlainTextOverSelectedText is true and skip format flag is true', function () {
      subscription = subscribeWithOptionConfig(subscription, textarea, true)

      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      dispatchSkipFormattingKeyEvent(textarea)
      paste(textarea, {'text/plain': 'https://github.com'})
      assert.equal(textarea.value, 'The examples can be found [here](https://github.com).')
    })

    it('pastes as plain text on selected text if pasteLinkAsPlainTextOverSelectedText is true', function () {
      subscription = subscribeWithOptionConfig(subscription, textarea, true)

      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      paste(textarea, {'text/plain': 'https://github.com'})
      // The text area will be unchanged at this stage as the paste won't be handled by our listener
      assert.equal(textarea.value, 'The examples can be found here.')
    })

    it('creates a markdown link when the pasted url includes a trailing slash', function () {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      paste(textarea, {'text/plain': 'https://www.github.com/'})
      assert.equal(textarea.value, 'The examples can be found [here](https://www.github.com/).')
    })

    it('creates a markdown link for longer urls', function () {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      paste(textarea, {'text/plain': 'https://www.github.com/path_to/something-different/too'})
      assert.equal(
        textarea.value,
        'The examples can be found [here](https://www.github.com/path_to/something-different/too).',
      )
    })

    it('creates a markdown link with query string', function () {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      paste(textarea, {'text/plain': 'https://www.github.com/path/to/something?query=true'})
      assert.equal(
        textarea.value,
        'The examples can be found [here](https://www.github.com/path/to/something?query=true).',
      )
    })

    it('creates a markdown link with hash params', function () {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      paste(textarea, {'text/plain': 'https://www.github.com/path/to/something#section'})
      assert.equal(
        textarea.value,
        'The examples can be found [here](https://www.github.com/path/to/something#section).',
      )
    })

    it('creates a link for http urls', function () {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'Look over here please'
      textarea.setSelectionRange(10, 14)
      const url = 'http://someotherdomain.org/another/thing'
      paste(textarea, {'text/plain': url})
      assert.equal(textarea.value, `Look over [here](${url}) please`)
    })

    it('creates a link when copied content includes spaces and a newline', () => {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'Look over here please'
      textarea.setSelectionRange(10, 14)
      const url = 'http://someotherdomain.org/another/thing            \n'
      paste(textarea, {'text/plain': url})
      assert.equal(textarea.value, `Look over [here](${url.trim()}) please`)
    })

    it("doesn't paste a markdown URL when pasting over a selected URL", function () {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here: https://docs.github.com'
      textarea.setSelectionRange(32, 55)
      paste(textarea, {'text/plain': 'https://github.com'})
      // Synthetic paste events don't manipulate the DOM. The same textarea value
      // means that the event handler didn't fire and normal paste happened.
      assert.equal(textarea.value, 'The examples can be found here: https://docs.github.com')
    })

    it("doesn't paste markdown URL when pasting after user at mentions", function () {
      textarea.value = '@'
      textarea.setSelectionRange(1, 1)
      const html = `
      <a href="http://github.localhost/monalisa">monalisa</a>
      `
      paste(textarea, {'text/plain': 'monalisa', 'text/html': html})

      // No change in textarea value here means no custom paste event handler was fired.
      // So the browser default paste handler will be used.
      assert.equal(textarea.value, '@')
    })

    it("doesn't paste markdown URL when additional text is being copied", function () {
      textarea.value = 'github'
      textarea.setSelectionRange(0, 6)
      paste(textarea, {'text/plain': 'https://github.com plus some other content'})
      // Synthetic paste events don't manipulate the DOM. The same textarea value
      // means that the event handler didn't fire and normal paste happened.
      assert.equal(textarea.value, 'github')
    })

    it('turns html tables into markdown', function () {
      const data = {
        'text/html': tableHtml,
      }
      paste(textarea, data)
      assert.include(textarea.value, tableMarkdown)
    })

    it('preserves complete Markdown when pasting multiple tables', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const html = `<p>BEFORE_9F3A_KEEP</p>
<table><tr><th>Key</th><th>Value</th></tr><tr><td>ALPHA_ROW</td><td>1</td></tr></table>
<p>MIDDLE_9F3A_MUST_SURVIVE</p>
<table><tr><th>Key</th><th>Value</th></tr><tr><td>BETA_ROW_MUST_SURVIVE</td><td>2</td></tr></table>
<p>AFTER_9F3A_KEEP</p>`
      const markdown = `BEFORE_9F3A_KEEP

| Key | Value |
| --- | --- |
| ALPHA_ROW | 1 |

MIDDLE_9F3A_MUST_SURVIVE

| Key | Value |
| --- | --- |
| BETA_ROW_MUST_SURVIVE | 2 |

AFTER_9F3A_KEEP`

      const event = paste(textarea, {'text/html': html, 'text/plain': markdown})
      assert.equal(textarea.value, markdown)
      assert.isTrue(event.defaultPrevented)
      for (const marker of [
        'BEFORE_9F3A_KEEP',
        'ALPHA_ROW',
        'MIDDLE_9F3A_MUST_SURVIVE',
        'BETA_ROW_MUST_SURVIVE',
        'AFTER_9F3A_KEEP',
      ]) {
        assert.equal(textarea.value.split(marker).length - 1, 1)
      }
    })

    it('keeps HTML when plain text omits content or a table', function () {
      const html =
        // eslint-disable-next-line github/unescaped-html-literal
        '<p>BEFORE</p><table><tr><th>FIRST</th></tr><tr><td>ONE</td></tr></table><p>MIDDLE</p><table><tr><th>SECOND</th></tr><tr><td>TWO</td></tr></table><p>AFTER</p>'
      const complete = 'BEFORE\n\n| FIRST |\n| --- |\n| ONE |\n\nMIDDLE\n\n| SECOND |\n| --- |\n| TWO |\n\nAFTER'
      paste(textarea, {'text/html': html, 'text/plain': complete})
      assert.equal(textarea.value, complete)
      for (const plain of [
        'BEFORE\n\n| FIRST |\n| --- |\n| ONE |\n\n| SECOND |\n| --- |\n| TWO |\n\nAFTER',
        'BEFORE\n\n| FIRST |\n| --- |\n| ONE |\n\nMIDDLE\n\nAFTER',
      ]) {
        textarea.value = ''
        paste(textarea, {'text/html': html, 'text/plain': plain})
        assert.equal(textarea.value, html)
      }
      textarea.value = ''
      paste(textarea, {'text/html': html})
      assert.equal(textarea.value, html)
    })

    it('does not insert twice when mixed clipboard formats include a link', function () {
      const html =
        // eslint-disable-next-line github/unescaped-html-literal
        '<p>BEFORE</p><table><tr><td>FIRST</td></tr></table><p><a href="https://example.com/">MIDDLE</a></p><table><tr><td>SECOND</td></tr></table>'
      const original = document.execCommand
      let insertCalls = 0
      document.execCommand = function (command, ...args) {
        if (command === 'insertText') insertCalls++
        return original.call(this, command, ...args)
      }
      try {
        paste(textarea, {
          'text/html': html,
          'text/plain': 'incomplete',
          'text/x-gfm': 'incomplete',
          'text/uri-list': 'https://example.com/pic.png',
        })
      } finally {
        document.execCommand = original
      }
      assert.equal(textarea.value, html)
      assert.equal(insertCalls, 1)
    })

    it('preserves nested and skipped table HTML', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const nested = '<table><tr><td>OUTER<table><tr><td>INNER</td></tr></table></td></tr></table>'
      const skipped =
        // eslint-disable-next-line github/unescaped-html-literal
        '<table data-paste-markdown-skip><tr><td>SKIP</td></tr></table><table><tr><td>KEEP</td></tr></table>'
      paste(textarea, {'text/html': nested})
      assert.equal(textarea.value, nested)
      textarea.value = ''
      paste(textarea, {'text/html': skipped})
      assert.equal(textarea.value, skipped)
    })

    it('preserves comments, attributes and Markdown syntax when plaintext is ambiguous', function () {
      /* eslint-disable github/unescaped-html-literal */
      const examples = [
        [
          '<!-- IMPORTANT --><table><tr><th>A</th></tr><tr><td>1</td></tr></table><table><tr><th>B</th></tr><tr><td>2</td></tr></table>',
          '| A |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |',
        ],
        [
          '<table title="IMPORTANT"><tr><th>A</th></tr><tr><td>1</td></tr></table><table><tr><th>B</th></tr><tr><td>2</td></tr></table>',
          '| A |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |',
        ],
        [
          '<table><tr><th>*A*</th></tr><tr><td>1</td></tr></table><table><tr><th>B</th></tr><tr><td>2</td></tr></table>',
          '| *A* |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |',
        ],
      ]
      /* eslint-enable github/unescaped-html-literal */
      for (const [html, plain] of examples) {
        textarea.value = ''
        paste(textarea, {'text/html': html, 'text/plain': plain})
        assert.equal(textarea.value, html)
      }
    })

    it('does not trust plain text that turns a literal paragraph into Markdown syntax', function () {
      const unsafe = ['# LITERAL_TEXT', '- item', '+ item', '1. item', '> quote', '---', '___', '~~strike~~']
      for (const paragraph of unsafe) {
        // eslint-disable-next-line github/unescaped-html-literal
        const html = `<p>BEFORE</p><table><tr><th>A</th></tr><tr><td>1</td></tr></table><p>${paragraph}</p><table><tr><th>B</th></tr><tr><td>2</td></tr></table><p>AFTER</p>`
        const plain = `BEFORE\n\n| A |\n| --- |\n| 1 |\n\n${paragraph}\n\n| B |\n| --- |\n| 2 |\n\nAFTER`
        textarea.value = ''
        paste(textarea, {'text/html': html, 'text/plain': plain})
        assert.equal(textarea.value, html)
      }
    })

    it('accepts ordinary prose containing hyphens, periods, numbers and an internal hash', function () {
      for (const paragraph of ['A-B has 2 items.', 'Version 1.2 is ready', 'A literal # inside prose']) {
        // eslint-disable-next-line github/unescaped-html-literal
        const html = `<p>BEFORE</p><table><tr><th>A</th></tr><tr><td>1</td></tr></table><p>${paragraph}</p><table><tr><th>B</th></tr><tr><td>2</td></tr></table><p>AFTER</p>`
        const plain = `BEFORE\n\n| A |\n| --- |\n| 1 |\n\n${paragraph}\n\n| B |\n| --- |\n| 2 |\n\nAFTER`
        textarea.value = ''
        paste(textarea, {'text/html': html, 'text/plain': plain})
        assert.equal(textarea.value, plain)
      }
    })

    it('requires header cells only in the first row and data cells afterward', function () {
      const cases = [
        // eslint-disable-next-line github/unescaped-html-literal
        '<table><tr><td>A</td></tr><tr><td>1</td></tr></table>',
        // eslint-disable-next-line github/unescaped-html-literal
        '<table><tr><th>A</th></tr><tr><th>1</th></tr></table>',
        // eslint-disable-next-line github/unescaped-html-literal
        '<table><tr><th></th></tr><tr><td>1</td></tr></table>',
      ]
      const plains = ['| A |\n| --- |\n| 1 |', '| A |\n| --- |\n| 1 |', '|  |\n| --- |\n| 1 |']
      // eslint-disable-next-line github/unescaped-html-literal
      const second = '<table><tr><th>B</th></tr><tr><td>2</td></tr></table>'
      for (let index = 0; index < cases.length; index++) {
        textarea.value = ''
        const html = cases[index] + second
        const plain = [plains[index], '| B |\n| --- |\n| 2 |'].join('\n\n')
        paste(textarea, {'text/html': html, 'text/plain': plain})
        assert.equal(textarea.value, html)
      }
      textarea.value = ''
      const validHtml = [
        // eslint-disable-next-line github/unescaped-html-literal
        '<table><tr><th>A</th></tr><tr><td>1</td></tr></table>',
        second,
      ].join('')
      const validPlain = '| A |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |'
      paste(textarea, {'text/html': validHtml, 'text/plain': validPlain})
      assert.equal(textarea.value, validPlain)
    })

    it('does not trust dotted text that GFM can turn into an autolink', function () {
      const cases = [
        [
          // eslint-disable-next-line github/unescaped-html-literal
          '<p>www.example.com</p><table><tr><th>A</th></tr><tr><td>1</td></tr></table><table><tr><th>B</th></tr><tr><td>2</td></tr></table>',
          'www.example.com\n\n| A |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |',
        ],
        [
          // eslint-disable-next-line github/unescaped-html-literal
          '<table><tr><th>www.example.com</th></tr><tr><td>1</td></tr></table><table><tr><th>B</th></tr><tr><td>2</td></tr></table>',
          '| www.example.com |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |',
        ],
      ]
      for (const [html, plain] of cases) {
        textarea.value = ''
        paste(textarea, {'text/html': html, 'text/plain': plain})
        assert.equal(textarea.value, html)
      }
    })

    it('does not trust a Markdown row whose extra cell GFM would discard', function () {
      const html =
        // eslint-disable-next-line github/unescaped-html-literal
        '<table><tr><th>A</th></tr><tr><td>1</td><td>EXTRA</td></tr></table><table><tr><th>B</th></tr><tr><td>2</td></tr></table>'
      const plain = '| A |\n| --- |\n| 1 | EXTRA |\n\n| B |\n| --- |\n| 2 |'
      paste(textarea, {'text/html': html, 'text/plain': plain})
      assert.equal(textarea.value, html)
    })

    it('does not trust Markdown alignment or a footer section absent from its structure', function () {
      const cases = [
        [
          // eslint-disable-next-line github/unescaped-html-literal
          '<table><tr><th>A</th></tr><tr><td>1</td></tr></table>',
          '| A |\n| :--- |\n| 1 |',
        ],
        [
          // eslint-disable-next-line github/unescaped-html-literal
          '<table><tr><th>A</th></tr><tfoot><tr><td>1</td></tr></tfoot></table>',
          '| A |\n| --- |\n| 1 |',
        ],
      ]
      // eslint-disable-next-line github/unescaped-html-literal
      const second = '<table><tr><th>B</th></tr><tr><td>2</td></tr></table>'
      for (const [first, firstPlain] of cases) {
        textarea.value = ''
        const html = [first, second].join('')
        const plain = [firstPlain, '| B |\n| --- |\n| 2 |'].join('\n\n')
        paste(textarea, {'text/html': html, 'text/plain': plain})
        assert.equal(textarea.value, html)
      }
    })

    it('keeps HTML on drop when an intermediate paragraph has Markdown syntax', function () {
      const html =
        // eslint-disable-next-line github/unescaped-html-literal
        '<table><tr><th>A</th></tr><tr><td>1</td></tr></table><p># LITERAL_TEXT</p><table><tr><th>B</th></tr><tr><td>2</td></tr></table>'
      const plain = '| A |\n| --- |\n| 1 |\n\n# LITERAL_TEXT\n\n| B |\n| --- |\n| 2 |'
      const transfer = new DataTransfer()
      transfer.setData('text/html', html)
      transfer.setData('text/plain', plain)
      const event = new DragEvent('drop', {dataTransfer: transfer, cancelable: true})
      textarea.dispatchEvent(event)
      assert.isTrue(event.defaultPrevented)
      assert.equal(textarea.value, html)
    })

    it('does not intercept table-like text without a table element', function () {
      const transfer = new DataTransfer()

      transfer.setData('text/html', '<!-- <table text -->')
      const event = new ClipboardEvent('paste', {clipboardData: transfer, cancelable: true})
      textarea.dispatchEvent(event)
      assert.isFalse(event.defaultPrevented)
      assert.equal(textarea.value, '')
    })

    it('keeps complex table markup when plain text cannot be verified', function () {
      const examples = [
        [
          // eslint-disable-next-line github/unescaped-html-literal
          '<p>BEFORE</p><table><tr><th>A</th></tr><tr><td colspan="2">MERGED</td></tr></table><table><tr><th>SECOND</th></tr><tr><td>2</td></tr></table>',
          'BEFORE\n\n| A |\n| --- |\n| MERGED |\n\n| SECOND |\n| --- |\n| 2 |',
        ],
        [
          // eslint-disable-next-line github/unescaped-html-literal
          '<p>BEFORE</p><table><tr><th>A</th></tr><tr><td><strong>RICH</strong></td></tr></table><table><tr><th>SECOND</th></tr><tr><td>2</td></tr></table>',
          'BEFORE\n\n| A |\n| --- |\n| RICH |\n\n| SECOND |\n| --- |\n| 2 |',
        ],
      ]
      for (const [html, plain] of examples) {
        textarea.value = ''
        paste(textarea, {'text/html': html, 'text/plain': plain})
        assert.equal(textarea.value, html)
      }
    })

    it('preserves single tables with mixed-case tag boundaries', function () {
      const tables = [
        // eslint-disable-next-line github/unescaped-html-literal
        '<TABLE><TR><TD>ONE</TD></TR></TABLE>',
        // eslint-disable-next-line github/unescaped-html-literal
        '<Table><tr><td>ONE</td></tr></TABLE>',
        // eslint-disable-next-line github/unescaped-html-literal
        '<table><tr><td>ONE</td></tr></Table>',
      ]
      for (const table of tables) {
        textarea.value = ''
        // eslint-disable-next-line github/unescaped-html-literal
        const html = `<p>BEFORE</p>${table}<p>AFTER</p>`
        paste(textarea, {'text/html': html})
        assert.equal(textarea.value, html)
      }
    })

    it('preserves HTML when table boundaries are damaged', function () {
      const html =
        // eslint-disable-next-line github/unescaped-html-literal
        '<p>BEFORE</p><table><tr><td>ONE</td></tr></table><p>MIDDLE</p><TABLE><tr><td>TWO</td></tr><p>AFTER</p>'
      paste(textarea, {'text/html': html, 'text/plain': 'ONE'})
      assert.equal(textarea.value, html)
    })

    it('handles a large multi-table fragment within the test timeout', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const html = '<table><tr><td>ROW</td></tr></table>'.repeat(1000)
      paste(textarea, {'text/html': html})
      assert.equal(textarea.value, html)
    })

    it('clears skip-formatting after a handled paste', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const html = '<table><tr><td>ONE</td></tr></table><table><tr><td>TWO</td></tr></table>'
      dispatchSkipFormattingKeyEvent(textarea)
      paste(textarea, {'text/html': html})
      assert.equal(textarea.value, '')
      paste(textarea, {'text/html': html})
      assert.equal(textarea.value, html)
    })

    it('does not cancel table paste or drop on unsupported elements', function () {
      const div = document.createElement('div')
      installTable(div)
      // eslint-disable-next-line github/unescaped-html-literal
      const html = '<table><tr><td>ONE</td></tr></table><table><tr><td>TWO</td></tr></table>'
      const transfer = new DataTransfer()
      transfer.setData('text/html', html)
      const pasteEvent = new ClipboardEvent('paste', {clipboardData: transfer, cancelable: true})
      const dropEvent = new DragEvent('drop', {dataTransfer: transfer, cancelable: true})
      div.dispatchEvent(pasteEvent)
      div.dispatchEvent(dropEvent)
      uninstallTable(div)
      assert.isFalse(pasteEvent.defaultPrevented)
      assert.isFalse(dropEvent.defaultPrevented)
    })

    it('does not handle a previously canceled event', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const html = '<table><tr><td>ONE</td></tr></table><table><tr><td>TWO</td></tr></table>'
      const transfer = new DataTransfer()
      transfer.setData('text/html', html)
      const event = new ClipboardEvent('paste', {clipboardData: transfer, cancelable: true})
      event.preventDefault()
      textarea.dispatchEvent(event)
      assert.equal(textarea.value, '')

      const drop = new DragEvent('drop', {dataTransfer: transfer, cancelable: true})
      drop.preventDefault()
      textarea.dispatchEvent(drop)
      assert.equal(textarea.value, '')
    })

    it('handles text drops and leaves file drops alone', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const html = '<table><tr><td>ONE</td></tr></table><p>MIDDLE</p><table><tr><td>TWO</td></tr></table>'
      const transfer = new DataTransfer()
      transfer.setData('text/html', html)
      const drop = new DragEvent('drop', {dataTransfer: transfer, cancelable: true})
      textarea.dispatchEvent(drop)
      assert.isTrue(drop.defaultPrevented)
      assert.equal(textarea.value, html)

      textarea.value = ''
      const files = new DataTransfer()
      files.items.add(new File(['content'], 'example.txt'))
      files.setData('text/html', html)
      const fileDrop = new DragEvent('drop', {dataTransfer: files, cancelable: true})
      textarea.dispatchEvent(fileDrop)
      assert.isFalse(fileDrop.defaultPrevented)
      assert.equal(textarea.value, '')
    })

    it('uses verified Markdown for a text drop', function () {
      const html =
        // eslint-disable-next-line github/unescaped-html-literal
        '<p>BEFORE</p><table><tr><th>ONE</th></tr><tr><td>A</td></tr></table><p>MIDDLE</p><table><tr><th>TWO</th></tr><tr><td>B</td></tr></table>'
      const markdown = 'BEFORE\n\n| ONE |\n| --- |\n| A |\n\nMIDDLE\n\n| TWO |\n| --- |\n| B |'
      const transfer = new DataTransfer()
      transfer.setData('text/html', html)
      transfer.setData('text/plain', markdown)
      const drop = new DragEvent('drop', {dataTransfer: transfer, cancelable: true})
      textarea.dispatchEvent(drop)
      assert.isTrue(drop.defaultPrevented)
      assert.equal(textarea.value, markdown)
    })

    it("doesn't execute JavaScript", async function () {
      let alertCalled = false
      window.secretFunction = function () {
        alertCalled = true
      }
      const data = {
        'text/html': `XSS<img/src/onerror=secretFunction()><table>`,
      }
      paste(textarea, data)

      await wait(100)

      assert.isFalse(alertCalled, 'A XSS was possible as alert was called')
    })

    it('retains text around tables', async function () {
      const data = {
        'text/html': `
        <p>Here is a cool table</p>
        ${tableHtml}
        <p>Very cool</p>
        `,
      }

      paste(textarea, data)
      assert.equal(
        textarea.value.trim(),
        // eslint-disable-next-line github/unescaped-html-literal
        `<p>Here is a cool table</p>\n        \n  \n${tableMarkdown}\n\n\n\n        <p>Very cool</p>`,
      )
    })

    it('rejects layout tables', function () {
      const data = {
        'text/html': `
        <table data-paste-markdown-skip>
          <thead><tr><th>name</th><th>origin</th></tr></thead>
          <tbody>
            <tr><td>hubot</td><td>github</td></tr>
            <tr><td>bender</td><td>futurama</td></tr>
          </tbody>
        </table>
        `,
      }
      paste(textarea, data)

      // Synthetic paste events don't manipulate the DOM. A empty textarea
      // means that the event handler didn't fire and normal paste happened.
      assertUnformattedPaste(textarea)
    })

    it('preserves malformed table HTML without truncating it', function () {
      // eslint-disable-next-line github/unescaped-html-literal, prefer-template
      const html = '<table'.repeat(999) + '<div><table></div>'
      const data = {
        'text/html': html,
      }
      paste(textarea, data)

      assert.equal(textarea.value, html)
    })

    it('accepts x-gfm', function () {
      paste(textarea, {'text/plain': 'hello', 'text/x-gfm': '# hello'})
      assert.include(textarea.value, '# hello')
    })

    it('turns one html link into a markdown link', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const link = `<meta charset='utf-8'><meta charset="utf-8">
        <b><a href="https://github.com/" style="text-decoration:none;"><span>link</span></a></b>`
      const plaintextLink = 'link'
      const markdownLink = '[link](https://github.com/)'

      paste(textarea, {'text/html': link, 'text/plain': plaintextLink})
      assert.equal(textarea.value, markdownLink)
    })

    it('turns mixed html content containing several links into appropriate markdown', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'>
        <b style="font-weight:normal;"><p dir="ltr"><span>This is a </span>
        <a href="https://github.com/">link</a><span> and </span>
        <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">another link</a></p>
        <br /><a href="https://github.com/"><span>Link</span></a><span> at the beginning, link at the </span>
        <a href="https://github.com/"><span>end</span></a></b>`
      // eslint-disable-next-line i18n-text/no-en
      const plaintextSentence = 'This is a link and another link\n\nLink at the beginning, link at the end'
      const markdownSentence =
        'This is a [link](https://github.com/) and [another link](https://www.youtube.com/watch?v=dQw4w9WgXcQ)\n\n' +
        '[Link](https://github.com/) at the beginning, link at the [end](https://github.com/)'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('deals with links with nested html', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<a href="https://example.com/"><span>foo</span></a>
      <a href="https://example.com/">bar</a>
      foo bar`
      const plaintextSentence = 'foo bar foo bar'
      const markdownSentence = '[foo](https://example.com/) [bar](https://example.com/) foo bar'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('deals with link labels that contains line breaks in html', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = '<a href="https://example.com/">foo\nbar</a>'
      const plaintextSentence = 'foo bar'
      const markdownSentence = '[foo bar](https://example.com/)'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it("doesn't render any markdown for html link without corresponding plaintext", function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const link = `<meta charset='utf-8'><a href="https://github.com/monalisa/playground/issues/1">
        Link pasting · Issue #1 · monalisa/playground (github.com)</a>`
      const plaintextLink = 'https://github.com/monalisa/playground/issues/1'
      const linkPreviewLink = {
        domain: 'github.com',
        preferred_format: 'text/html;content=titled-hyperlink',
        title: 'Link pasting · Issue #1 · monalisa/playground (github.com)',
        type: 'website',
        url: 'https://github.com/monalisa/playground/issues/1',
      }

      paste(textarea, {'text/html': link, 'text/plain': plaintextLink, 'text/link-preview': linkPreviewLink})
      assert.equal(textarea.value, '')
    })

    it("doesn't render any markdown for GitHub handles", function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const link = `<meta charset='utf-8'><a href="https://github.com/octocat" data-hovercard-type="user">@octocat</a>`
      const plaintextLink = '@octocat'

      paste(textarea, {'text/html': link, 'text/plain': plaintextLink})
      assert.equal(textarea.value, '')
    })

    it("doesn't render any markdown for GitHub team handles", function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const link = `<meta charset='utf-8'><a href="https://github.com/orgs/github/teams/octocats" data-hovercard-type="team">@github/octocats</a>`
      const plaintextLink = '@github/octocats'

      paste(textarea, {'text/html': link, 'text/plain': plaintextLink})
      assert.equal(textarea.value, '')
    })

    it('retains urls of special GitHub links', function () {
      const href = 'https://github.com/octocat/repo/issues/1'
      // eslint-disable-next-line github/unescaped-html-literal
      const link = `<meta charset='utf-8'><a href=${href} data-hovercard-type="issue">#1</a>`
      const plaintextLink = '#1'

      paste(textarea, {'text/html': link, 'text/plain': plaintextLink})
      assert.equal(textarea.value, href)
    })

    it('leaves plaintext links alone', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'>
        <b style="font-weight:normal;"><p dir="ltr"><span>This is a </span>
        <a href="https://github.com/">link</a><span> and </span>
        <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">another link</a></p>
        <br /><a href="https://github.com/">Link</a><span> at the beginning, link at the </span>
        <a href="https://github.com/"><span>end</span></a></b>`
      /* eslint-disable i18n-text/no-en */
      const plaintextSentence = 'This is a link and another link\n\nLink at the beginning, link at the end'
      /* eslint-enable i18n-text/no-en */
      const markdownSentence =
        'This is a [link](https://github.com/) and [another link](https://www.youtube.com/watch?v=dQw4w9WgXcQ)\n\n' +
        '[Link](https://github.com/) at the beginning, link at the [end](https://github.com/)'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('finds the right link when identical labels are present', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'><span>example<span> </span>
      </span><a href="https://example.com/">example</a>`
      const plaintextSentence = 'example example'
      const markdownSentence = 'example [example](https://example.com/)'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('skip markdown formatting with (Ctrl+Shift+v)', function () {
      const data = {
        'text/html': tableHtml,
      }

      dispatchSkipFormattingKeyEvent(textarea)
      paste(textarea, data)
      assertUnformattedPaste(textarea)

      textarea.value = ''
      paste(textarea, data)
      assert.include(textarea.value, tableMarkdown)
    })

    it('pastes markdown with links correctly when identical labels are present', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'><span>
      foo bar baz <a href="https://www.abcxyz.com/">bar</a></span>`
      const plaintextSentence = 'foo bar baz bar'
      const markdownSentence = 'foo bar baz [bar](https://www.abcxyz.com/)'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('pastes markdown with line breaks and links correctly when identical labels are present', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'>
      <p>foo bar
          bar baz <a href="https://www.abcxyz.org/">bar</a> </p>
          <p>baz <a href="https://www.abcxyz.com/">baz</a> foo</p>`
      const plaintextSentence = 'foo bar bar baz bar baz baz foo'
      const markdownSentence = 'foo bar bar baz [bar](https://www.abcxyz.org/) baz [baz](https://www.abcxyz.com/) foo'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('pastes markdown with multiple links and labels correctly', function () {
      // eslint-disable-next-line i18n-text/no-en
      const commonSentence = 'Great example for example resources for developers'
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'><span>
      ${commonSentence}: <a href="https://www.example.com/">example</a> and <a href="https://www.example.com/">example</a>.</span>`
      const plaintextSentence = `${commonSentence}: example and example.`
      const markdownSentence = `${commonSentence}: [example](https://www.example.com/) and [example](https://www.example.com/).`

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('pastes markdown with link labels that contains special characters in html', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'>
      <p>foo&bar <a href="https://www.abcxyz.org/">foo bar</a> <a href="https://example.com/?q=foo&bar=baz">foo&bar</a></p>`
      const plaintextSentence = 'foo&bar foo bar foo&bar'
      const markdownSentence =
        'foo&bar [foo bar](https://www.abcxyz.org/) [foo&bar](https://example.com/?q=foo&bar=baz)'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('pastes markdown with link labels that contains emojis in html', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'>
      <p>foo bar <a href="https://www.abcxyz.org/">foo</a> bar foo <a href="https://example.com/">🚀 bar 🚀</a></p>`
      const plaintextSentence = 'foo bar foo bar foo 🚀 bar 🚀'
      const markdownSentence = 'foo bar [foo](https://www.abcxyz.org/) bar foo [🚀 bar 🚀](https://example.com/)'

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('finds the right link when identical labels are present chrome and edge', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'>
      <p>foo bar<br>bar<span> </span><a href="https://www.abcxyz.org/">bar</a></p><p>bar<span> </span><a href="https://www.abcxyz.com/">bar</a><span> </span>foo</p>`

      const markdownSentence = `foo bar
bar [bar](https://www.abcxyz.org/)

bar [bar](https://www.abcxyz.com/) foo`

      const plaintextSentence = `foo bar
bar bar

bar bar foo`

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })

    it('finds the right link when identical labels are present firefox', function () {
      // eslint-disable-next-line github/unescaped-html-literal
      const sentence = `<meta charset='utf-8'>
      <div><div><p>foo bar<br>
      bar <a href="https://www.abcxyz.org/">bar</a></p>
      <p>bar <a href="https://www.abcxyz.com/">bar</a> foo</p></div></div>`
      const markdownSentence = `foo bar
bar [bar](https://www.abcxyz.org/)

bar [bar](https://www.abcxyz.com/) foo`

      const plaintextSentence = `foo bar
bar bar

bar bar foo`

      paste(textarea, {'text/html': sentence, 'text/plain': plaintextSentence})
      assert.equal(textarea.value, markdownSentence)
    })
  })
})

/**
 * Note: It's possible to construct and dispatch a synthetic paste event,
 * but this will not affect the document's contents in tests to assert it.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event
 * So for that reason assert result on keydown (Ctrl+Shift+v) will be empty '' here.
 */
function assertUnformattedPaste(textarea) {
  return assert.equal(textarea.value, '')
}

function dispatchSkipFormattingKeyEvent(textarea) {
  textarea.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'v',
      code: 'KeyV',
      shiftKey: true,
      ctrlKey: true,
      metaKey: true,
    }),
  )
}

function subscribeWithOptionConfig(subscription, textarea, urlLinks) {
  // Clear the before test subscription with no config and re-subscribe with config
  subscription.unsubscribe()
  return subscribe(textarea, {defaultPlainTextPaste: {urlLinks}})
}

function paste(textarea, data) {
  const dataTransfer = new DataTransfer()
  for (const key in data) {
    dataTransfer.setData(key, data[key])
  }
  const event = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    cancelable: true,
  })
  textarea.dispatchEvent(event)
  return event
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
