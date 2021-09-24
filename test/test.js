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
      textarea.value = 'The examples can be found here.'
      textarea.setSelectionRange(26, 30)
      paste(textarea, {'text/plain': 'https://github.com'})
      assert.equal(textarea.value, 'The examples can be found [here](https://github.com).')
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
