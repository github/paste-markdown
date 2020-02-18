import subscribe from '../dist/index.esm.js'

describe('paste-markdown', function() {
  describe('with quotable selection', function() {
    let subscription, textarea
    beforeEach(function() {
      document.body.innerHTML = `
        <textarea data-paste-markdown></textarea>
      `

      textarea = document.querySelector('textarea[data-paste-markdown]')
      subscription = subscribe(textarea)
    })

    afterEach(function() {
      subscription.unsubscribe()
      document.body.innerHTML = ''
    })

    it('pastes image uris as markdown', function() {
      paste(textarea, {'text/uri-list': 'https://github.com/github.png\r\nhttps://github.com/hubot.png'})
      assert.include(textarea.value, '![](https://github.com/github.png)\n\n![](https://github.com/hubot.png)')
    })

    it('pastes gfm into markdown', function() {
      paste(textarea, {'text/plain': 'hello', 'text/x-gfm': '# hello'})
      assert.include(textarea.value, '# hello')
    })

    it('pastes html tables as markdown', function() {
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

    it('does not paste excluded content as markdown', function() {
      const data = {
        'text/html': `
        <table class="js-comment">
          <thead><tr><th>name</th><th>origin</th></tr></thead>
          <tbody>
            <tr><td>hubot</td><td>github</td></tr>
            <tr><td>bender</td><td>futurama</td></tr>
          </tbody>
        </table>
        `
      }
      paste(textarea, data)
      assert.equal(textarea.value, '')
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
