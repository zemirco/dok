
### returns(returns)

Generate markdown return block


- `returns` **Object** - Returns object from JSDoc



#### Returns

- **String** - Markdown formatted list item



#### Example


`docs.json`
```javascript
{
  type: 'String',
  description: '<p>Some description here</p>'
}
```

`index.js`
```javascript
var docs = require('./docs.json');
console.log(returns(docs));
// - **String** - Some description here
```


