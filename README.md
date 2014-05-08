
# dok

JavaScript documentation generator based on JSDoc.

## Installation

`npm install doc -g`

## Usage

```bash
Usage: dok [options] [command]

Commands:

  create                 create docs/ folder with .md partials and index.html
  publish                push docs to gh-pages
  readme [options]       include .md partials in your README.md

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```

## Demo

dok has created docs for itself. [Check them out](http://zemirco.github.io/dok).

## About

dok uses JSDoc to parse comments. It comes with a patched version of the [haruki](https://github.com/jsdoc3/jsdoc/blob/master/templates/haruki/publish.js)
theme that includes line numbers. Those are required for deep linking to source
code on GitHub.

`dok create` parses JSDoc comments from your `index.js`. It creates a new directory
`docs/includes/` with markdown files for all functions. It also create an `index.html`
file with some CSS and JS which is the root for `gh-pages`.

`dok publish` pushes all content from the `docs/` directory to `gh-pages`.

`dok readme` adds all markdown partials to your `README.md`. By default
all content is placed below '## Methods'.

## Important

JSDoc uses `<caption></caption>` tags for @example captions.

```js
/**
 * @example <caption>config.js (all other DBs)</caption>
 * exports.db = {
 *   url: 'postgres://127.0.0.1:5432/',
 *   name: 'users',
 *   collection: 'my_user_table'
 * }
 */
```

That's pretty hard to read and to write. dok uses plain markdown.

```js
/**
 * @example
 * `config.js (all other DBs)`
 *
 * exports.db = {
 *   url: 'postgres://127.0.0.1:5432/',
 *   name: 'users',
 *   collection: 'my_user_table'
 * }
 */
```

## Test

not yet

`npm test`

## License

MIT
