import {subscribe} from '../dist/index.esm.js'

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

    it('turns image uris into markdown', function () {
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

    it("doesn't paste a markdown URL when pasting over a selected URL", function () {
      // eslint-disable-next-line i18n-text/no-en
      textarea.value = 'The examples can be found here: https://docs.github.com'
      textarea.setSelectionRange(32, 55)
      paste(textarea, {'text/plain': 'https://github.com'})
      // Synthetic paste events don't manipulate the DOM. The same textarea value
      // means that the event handler didn't fire and normal paste happened.
      assert.equal(textarea.value, 'The examples can be found here: https://docs.github.com')
    })

    it('turns html tables into markdown', function () {
      const data = {
        'text/html': `
        <table>
          <thead><tr><th>name</th><th>origin</th></tr></thead>
          <tbody>
            <tr><td>hubot</td><td>github</td></tr>
            <tr><td>bender</td><td>futurama</td></tr>
          </tbody>
        </table>
        `
      }
      paste(textarea, data)
      assert.include(textarea.value, 'name | origin\n-- | --\nhubot | github\nbender | futurama')
    })

    it("doesn't execute JavaScript", async function () {
      let alertCalled = false
      window.secretFunction = function () {
        alertCalled = true
      }
      const data = {
        'text/html': `XSS<img/src/onerror=secretFunction()><table>`
      }
      paste(textarea, data)

      await wait(100)

      assert.isFalse(alertCalled, 'A XSS was possible as alert was called')
    })

    it('retains text around tables', async function () {
      const data = {
        'text/html': `
        <p>Here is a cool table</p>
        <table>
          <thead><tr><th>name</th><th>origin</th></tr></thead>
          <tbody>
            <tr><td>hubot</td><td>github</td></tr>
            <tr><td>bender</td><td>futurama</td></tr>
          </tbody>
        </table>
        <p>Very cool</p>
        `
      }

      paste(textarea, data)
      assert.equal(
        textarea.value.trim(),
        // eslint-disable-next-line github/unescaped-html-literal
        '<p>Here is a cool table</p>\n        \n\nname | origin\n-- | --\nhubot | github\nbender | futurama\n\n\n        <p>Very cool</p>'
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
        `
      }
      paste(textarea, data)

      // Synthetic paste events don't manipulate the DOM. A empty textarea
      // means that the event handler didn't fire and normal paste happened.
      assert.equal(textarea.value, '')
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
        url: 'https://github.com/monalisa/playground/issues/1'
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
  })
})

function paste(textarea, data) {
  const dataTransfer = new DataTransfer()
  for (const key in data) {
    dataTransfer.setData(key, data[key])
  }
  const event = new ClipboardEvent('paste', {
    clipboardData: dataTransfer
  })
  textarea.dispatchEvent(event)
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
