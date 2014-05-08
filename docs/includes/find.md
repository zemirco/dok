
### find(level, headings)

Find first heading with given level in `headings` array.
`headings` is a subarray sliced just behind the heading after that
we'd like to include the markdown content.


- `level` **Number** - Heading level. Number between <code>1</code> and <code>6</code>

- `headings` **Array** - Partial array of all README.md headings





#### Example


```javascript
var level = 3;
var headings = ['# a', '### b', '## c', '## d'];
var index = find(level, headings);
// 1
```


