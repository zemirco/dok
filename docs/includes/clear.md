
### clear(section, readme)

Clear old content from `readme`. Start just behind `section` and look
for next heading that has the same level. Everything in between is cleared.


- `section` **String** - Clear all content below this section

- `readme` **String** - All markdown content from README.md



#### Returns

- **String** - `readme` without any content below `section`



#### Example


`README.md`
```javascript
# Some title

## Installation

`npm install module`

## Config

Here is how to configure the module.

### Sub config

...

## Methods

### sum(x,y)

Returns the sum of two Numbers.

...

## Test

...

## License

...
```

`index.js`
```javascript
var readme = fs.readFileSync('./README.md', 'utf8');
var section = 'Methods';
readme = clear(section, readme);
// # Some title
//
// ## Installation
//
// `npm install module`
//
// ## Config
//
// Here is how to configure the module.
//
// ### Sub config
//
// ...
//
// ## Methods
//
// ## Test
//
// ...
//
// ## License
//
// ...
```


