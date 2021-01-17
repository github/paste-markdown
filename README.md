# Paste Markdown objects

- Paste spreadsheet cells and HTML tables as a Markdown tables.
- Paste image URLs as Markdown image links.
- Paste markdown as markdown. See [`@github/quote-selection`/Preserving markdown syntax](https://github.com/github/quote-selection/tree/9ae5f88f5bc3021f51d2dc9981eca83ce7cfe04f#preserving-markdown-syntax) for details.

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

### Excluding `<table>`s

Some `<table>`s are not meant to be pasted as markdown; for example, a file content table with line numbers in a column. Use `data-paste-markdown-skip` to prevent it.

```html
<table data-paste-markdown-skip>
  ...
</table>
```

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
