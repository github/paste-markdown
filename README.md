# Paste Markdown objects

- Paste spreadsheet cells and HTML tables as a Markdown tables.
- Paste URLs on selected text as Markdown links.
- Paste text containing links as text containing Markdown links.
- Paste image URLs as Markdown image links.
- Paste markdown as markdown. See [`@github/quote-selection`/Preserving markdown syntax](https://github.com/github/quote-selection/tree/9ae5f88f5bc3021f51d2dc9981eca83ce7cfe04f#preserving-markdown-syntax) for details.

## Installation

```
$ npm install @github/paste-markdown
```

## Usage

```js
import {subscribe} from '@github/paste-markdown'

// Subscribe the behavior to the textarea.
subscribe(document.querySelector('textarea[data-paste-markdown]'))
```

Using a library like [selector-observer][so], the behavior can automatically
be applied to any element matching a selector.

[so]: https://github.com/josh/selector-observer

```js
import {observe} from 'selector-observer'
import {subscribe} from '@github/paste-markdown'

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

### Granular control for pasting as plain text

If you're wanting more granular support of pasting certain items as plain text by default, you can pass in the controls config at the `subscribe` level.

Our config support looks as follows:

```js
import {subscribe} from '@github/paste-markdown'

// Subscribe the behavior to the textarea with pasting URL links as plain text by default.
subscribe(document.querySelector('textarea[data-paste-markdown]'), {defaultPlainTextPaste: {urlLinks: true}})
```

In this scenario above, pasting a URL over selected text will paste as plain text by default, but pasting a table will still paste as markdown by default.

Only the `urlLinks` param is currently supported.

If there is no config passed in, or attributes missing, this will always default to `false`, being the existing behavior.

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
