
### parseExamples(examples)

Generate gfm compatible code block from JSDoc parsed
examples array.


- `examples` **Array** - JSDoc examples array



#### Returns

- **Array** - Fenced code blocks with separate caption



#### Example


```javascript
var examples = [
  'var z = sum(10, 20);\nconsole.log(z);\n// 40'
];
var parsed = parseExamples(examples);
// [
//   '```javascript\nvar z = sum(10, 20);\nconsole.log(z);\n// 40\n```'
// ]
```


