
### parseArgs(fn)

Generate a String with comma separated function arguments.
Put square brackets around optional arguments.
Ignore child arguments like `config.key`.


- `fn` **Object** - JSON object for single function from JSDoc



#### Returns

- **String** - Comma separated arguments



#### Example


```javascript
var fn = {
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
};
var out = parseArgs(fn);
// x, [y]
```


