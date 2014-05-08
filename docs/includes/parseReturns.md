
### parseReturns(returns)

Generate markdown returns block.


- `returns` **Object** - Returns object from JSDoc



#### Returns

- **String** - Markdown formatted list item



#### Example


```javascript
var returns = {
  type: 'String',
  description: '<p>Some description here</p>'
};
var parsed = parseReturns(returns);
// - **String** - Some description here
```


