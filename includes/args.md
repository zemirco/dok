
### args(fn)

Generate a String with comma separated function arguments.
Put square brackets around optional arguments.
Ignore child arguments like `config.key`.


- `fn` **Object** - JSON object for single function from JSDoc



#### Returns

- **String** - Comma separated arguments



#### Example


`fn.json`
```javascript
{
  name: 'sum',
  description: '...',
  parameters: [
    {
      name: 'x',
      optional: ''
    },
    {
      name: 'y',
      optional: true
    }
  ]
}
```

`index.js`
```javascript
var fn = require('./fn.json');
var out = args(fn);
// x, [y]
```


