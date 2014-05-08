
### getLevel(str)

Return heading level. Count number of hashes (`#`) in `str`.


- `str` **String** - Markdown heading string



#### Returns

- **Number** - Number of hashes



#### Example


```javascript
var one = '## a';
var levelOne = getLevel(one);  // 2
var two = '#### b';
var levelTwo = getLevel(two);  // 4
```


