
### parseParams(params)

Generate markdown list item from parameter object.


- `params` **Array** - Array with parameters from JSDoc



#### Returns

- **Array** - Array with markdown list items



#### Example


```javascript
var params = [
  {
    name: 'x',
    type: 'Number',
    description: '<p>First number</p>'
  },
  {
    name: 'y',
    type: 'Number',
    description: '<p>Second number</p>',
    default: '20',
    optional: true
  }
];
var parsed = parseParams(params);
// [
//   - `x` **Number** - First number
//   - `y` **Number** *optional*  - Second number - default `20`
// ]
```


