# Paste Markdown objects

Paste spreadsheet cells as a Markdown table. Convert pasted image URLs to
Markdown image link syntax.

## Installation

```
$ npm install @github/paste-markdown
```

## Usage

```js
import subscribe from '@github/paste-markdown'

// Subscribe the behavior to the textarea.
subscribe(document.querySelector('textarea[data-paste-markdown]'))
```

Using a library like [selector-observer][so], the behavior can automatically
be applied to any element matching a selector.

[so]: https://github.com/josh/selector-observer

```js
import {observe} from 'selector-observer'
import subscribe from '@github/paste-markdown'

// Subscribe the behavior to all matching textareas.
observe('textarea[data-paste-markdown]', {subscribe})
```

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
