
### parseDescription(desc)

Generate gfm description from JSDoc description.
Replace `code` tags with markdown code tags.


- `desc` **String** - JSDoc description string



#### Returns

- **String** - Markdown description



#### Example


```javascript
var desc = '<p>Some description with variable <code>a</code></p>'
var parsed = parseDescription(desc);
// Some description with variable `a`
```


