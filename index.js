
var fs = require('fs');
var os = require('os');
var shell = require('shelljs');
var handlebars = require('handlebars');
var marked = require('marked');
var mkdirp = require('mkdirp');

/**
 * Internal helpers
 */

// OS dependent line break
var eol = os.EOL;

// line breaks for all OS with non-capturing group
var linebreak = '(?:\\r\\n|\\n|\\r)';

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
String.prototype.escape = function(){
  return this.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

String.prototype.p = function() {
  return this.replace(/<\/?p>/g, '');
};

String.prototype.code = function() {
  return this.replace(/<\/?code>/g, '`');
};

/**
 * Generate docs JSON by using patched JSDoc haruki template.
 * The patched version includes `lineno`.
 *
 * @param {String} file - JavaScript file with comments to parse
 * @returns {Object} JSON data for all comments in file
 */
function jsdoc(file) {
  var c = ' --configure ' + __dirname + '/templates/conf.json ';
  var d = ' --destination console ';
  var t = ' --template ' + __dirname + '/templates/haruki';
  var command = __dirname + '/node_modules/.bin/jsdoc ' + file + c + d + t;
  // use execSync as soon as it is available -> node.js version 0.12 ?!?
  var data = shell.exec(command, {silent: true});
  if (data.code) throw new Error(data.output);
  return JSON.parse(data.output);
}

/**
 * Generate a String with comma separated function arguments.
 * Put square brackets around optional arguments.
 * Ignore child arguments like `config.key`.
 *
 * @example
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
 *
 * @param {Object} fn - JSON object for single function from JSDoc
 * @returns {String} Comma separated arguments
 */
function parseArgs(fn) {
  var title = '';
  fn.parameters.forEach(function(param, index) {
    if (param.name.indexOf('.') === -1) {
      var part = param.optional ? '[' + param.name + ']' : param.name;
      if (index !== 0) part = ', ' + part;
      title += part;
    }
  });
  return title;
}

/**
 * Generate gfm description from JSDoc description.
 * Replace `code` tags with markdown code tags.
 *
 * @example
   var desc = '<p>Some description with variable <code>a</code></p>'
   var parsed = parseDescription(desc);
   // Some description with variable `a`
 *
 * @param {String} desc - JSDoc description string
 * @returns {String} Markdown description
 */
function parseDescription(desc) {
  if (!desc) return;
  return desc.p().code();
}

/**
 * Generate gfm compatible code block from JSDoc parsed
 * examples array.
 *
 * @example
   var examples = [
     'var z = sum(10, 20);\nconsole.log(z);\n// 40'
   ];
   var parsed = parseExamples(examples);
   // [
   //   '```javascript\nvar z = sum(10, 20);\nconsole.log(z);\n// 40\n```'
   // ]
 *
 * @param {Array} examples - JSDoc examples array
 * @returns {Array} Fenced code blocks with separate caption
 */
function parseExamples(examples) {
  if (!examples) return;
  return examples.map(function(example) {
    // get caption
    var rx = new RegExp('^' + linebreak + '?(`.+`)' + linebreak);
    var match = rx.exec(example);
    // no caption
    if (!match) return '```javascript' + eol + example + eol + '```';
    var caption = match[1];
    // remove escaped caption from code
    var re = new RegExp(caption.escape() + linebreak + '+');
    var code = example.replace(re, '');
    return caption + eol + '```javascript' + eol + code + eol + '```';
  });
}

/**
 * Generate markdown list item from parameter object.
 *
 * @example
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
 *
 * @param {Array} params - Array with parameters from JSDoc
 * @returns {Array} Array with markdown list items
 */
function parseParams(params) {
  if (!params) return;
  return params.map(function(param) {
    // split param name like config.key in array
    var names = param.name.split('.');
    // check for param like config.key
    var child = (names.length > 1) ? true : false;
    // indent if param is a child
    var indentation = child ? '  ' : '';
    // optional flag only for parent params
    var optional = (param.optional && !child) ? ' *optional* ' : '';
    var name = child ? names[1] : param.name;
    name = '`' + name + '`';
    var type = Array.isArray(param.type) ? param.type.join(', ') : param.type;
    type = '**' + type + '**';
    // remove <p></p> tags from description
    var desc = param.description.p();
    desc = ' - ' + desc;
    // default values
    var def = param.default ? ' - default `' + param.default + '`' : '';
    return indentation + '- ' + name + ' ' + type + optional + desc + def;
  });
}


/**
 * Generate markdown returns block.
 *
 * @example
   var returns = {
     type: 'String',
     description: '<p>Some description here</p>'
   };
   var parsed = parseReturns(returns);
   // - **String** - Some description here
 *
 * @param {Object} returns - Returns object from JSDoc
 * @returns {String} Markdown formatted list item
 */
function parseReturns(returns) {
  if (!returns) return;
  var type = '- **' + returns.type + '**';
  var desc = returns.description ? ' - ' + returns.description.p().code() : '';
  return type + desc;
}

/**
 * Use handlebars to render template to index.html. Include line number for
 * link to source code on GitHub.
 *
 * @param {Array} fns - Array with all functions from JSDoc json
 */
function render(fns) {
  var cwd = process.cwd();
  // loop over all functions to get markdown content and create anchor links
  var sections = [];
  fns.forEach(function(fn) {
    // markdown
    var markdown = fs.readFileSync(cwd + '/docs/includes/' + fn.name + '.md', 'utf8');
    sections.push(marked(markdown));
    // anchor links
    var name = fn.name + '-';
    var args = '';
    fn.parameters.forEach(function(param) {
      // check for params like config.key
      if (param.name.indexOf('.') === -1) {
        args += param.name + '-';
      }
    });
    fn._dok_anchor = (name + args).toLowerCase();
  });
  var source = fs.readFileSync(__dirname + '/templates/index.hbs.html', 'utf8');
  var template = handlebars.compile(source);
  // read package.json
  var pkg = require(cwd + '/package.json');
  var index = template({
    title: pkg.name,
    repo: pkg.repository && pkg.repository.url,
    main: pkg.main,
    sections: sections,
    functions: fns
  });
  fs.writeFileSync(cwd + '/docs/index.html', index);
}

/**
 * Copy CSS and JS folder to modules docs/ folder. These static assets
 * are required for index.html.
 */
function copy() {
  var cwd = process.cwd();
  // create folders for static files
  mkdirp.sync(cwd + '/docs/css');
  mkdirp.sync(cwd + '/docs/js');
  // read all static files
  var bsjs = fs.readFileSync(__dirname + '/templates/js/bootstrap.min.js', 'utf8');
  var prismjs = fs.readFileSync(__dirname + '/templates/js/prism.js', 'utf8');
  var prismcss = fs.readFileSync(__dirname + '/templates/css/prism.css', 'utf8');
  var stylescss = fs.readFileSync(__dirname + '/templates/css/styles.css', 'utf8');
  // write static files
  fs.writeFileSync(cwd + '/docs/js/bootstrap.min.js', bsjs);
  fs.writeFileSync(cwd + '/docs/js/prism.js', prismjs);
  fs.writeFileSync(cwd + '/docs/css/prism.css', prismcss);
  fs.writeFileSync(cwd + '/docs/css/styles.css', stylescss);
}

/**
 * Write markdown files for each function.
 *
 * @params {Array} fns - Array with all functions from JSDoc
 */
function write(fns) {
  var cwd = process.cwd();
  mkdirp.sync(cwd + '/docs/includes');
  var source = fs.readFileSync(__dirname + '/templates/function.hbs.md', 'utf8');
  var template = handlebars.compile(source);
  fns.forEach(function(fn) {
    // create some data for handlebars template
    var locals = {
      name: fn.name,
      args: parseArgs(fn),
      description: parseDescription(fn.description),
      parameters: parseParams(fn.parameters),
      returns: parseReturns(fn.returns),
      examples: parseExamples(fn.examples)
    };
    // generate markdown file for each function
    var markdown = template(locals);
    // write markdown files
    fs.writeFileSync(cwd + '/docs/includes/' + fn.name + '.md', markdown);
  });
}

/**
 * Create docs/ directory with .md partials in includes/ directory.
 * Render index.html and copy statis assets (CSS and JS) to /docs
 * directory.
 *
 * @param {String} file - JavaScript with JSDoc comments
 */
function create(file) {
  // 1. generate json docs
  var fns = jsdoc(file).functions;
  if (!fns) return;
  // 2. write .md partials for all functions
  write(fns);
  // 3. render index.html
  render(fns);
  // 4. copy static assets to docs/ directory
  copy();
}

/**
 * Return heading level. Count number of hashes (`#`) in `str`.
 *
 * @example
   var one = '## a';
   var levelOne = getLevel(one);  // 2
   var two = '#### b';
   var levelTwo = getLevel(two);  // 4
 *
 * @param {String} str - Markdown heading string
 * @returns {Number} Number of hashes
 */
function getLevel(str) {
  var hashes = str.match(/#+/);
  return hashes[0].length;
}

/**
 * Find section index in array with all README.md headings.
 *
 * @example
   var section = 'c';
   var headings = ['# a', '## b', '## c', '## d', '## e'];
   // 2
 *
 * @param {String} section - Section name
 * @param {Array} headings - Array with all README.md headings
 */
function index(section, headings) {
  for (var i = 0; i < headings.length; i++) {
    var heading = headings[i];
    if (heading.indexOf(section) !== -1) return i;
  }
  throw new Error('your README.md doesn\'t have the heading "' + section + '"');
}

/**
 * Find first heading with given level in `headings` array.
 * `headings` is a subarray sliced just behind the heading after that
 * we'd like to include the markdown content.
 *
 * @example
   var level = 3;
   var headings = ['# a', '### b', '## c', '## d'];
   var index = find(level, headings);
   // 1
 *
 * @param {Number} level - Heading level. Number between `1` and `6`
 * @param {Array} headings - Partial array of all README.md headings
 */
function find(level, headings) {
  for (var i = 0; i < headings.length; i++) {
    var l = getLevel(headings[i]);
    if (l === level) return i;
  }
}

/**
 * Clear old content from `readme`. Start just behind `section` and look
 * for next heading that has the same level. Everything in between is cleared.
 *
 * @example
   `README.md`

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
 *
 * @example
   `index.js`

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
 *
 * @param {String} section - Clear all content below this section
 * @param {String} readme - All markdown content from README.md
 * @returns {String} `readme` without any content below `section`
 */
function clear(section, readme) {
  // find section name
  var re = new RegExp('#+\\s' + section);
  // find all sections in readme
  var headings = readme.match(/#+\s{1}.+/g);
  if (!headings) throw new Error('your README.md doesn\'t have any headings');
  // find index of starting heading
  var start = index(section, headings);
  // get level of start heading
  var level = getLevel(headings[start]);
  // find heading after 'methods' with the same level
  var subarray = headings.slice(start + 1);
  // find index of next section
  var j = find(level, subarray);
  var to = readme.indexOf(subarray[j]);
  var match = re.exec(readme);
  var end = match.index + match[0].length;
  // clear old content between sections
  return readme.slice(0, end) + readme.slice(to);
}

/**
 * Include markdown content into `readme`.
 *
 * @param {String} section - `content` is included just below this section
 * @param {String} readme - Old README.md that is cleared below `section`
 * @param {content} content - The content to include after `section`
 */
function include(section, readme, content) {
  var re = new RegExp('#+\\s' + section);
  var match = re.exec(readme);
  var end = match.index + match[0].length;
  return readme.slice(0, end) + content + readme.slice(end);
}

/**
 * Include .md partials in README.md below `section`.
 *
 * @param {String} section - Section name
 */
function updateReadme(section) {
  var cwd = process.cwd();
  var readme = fs.readFileSync(cwd + '/README.md', 'utf8');
  readme = clear(section, readme);
  var md = jsdoc('index.js').functions.map(function(fn) {
    return fs.readFileSync(cwd + '/docs/includes/' + fn.name + '.md', 'utf8');
  }).join('');
  readme = include(section, readme, md);
  fs.writeFileSync(cwd + '/README.md', readme);
}

// export all functions
// 'var name = exports.name = function() {}' doesn't work with JSDoc
exports.jsdoc = jsdoc;
exports.parseArgs = parseArgs;
exports.parseDescription = parseDescription;
exports.parseExamples = parseExamples;
exports.parseParams = parseParams;
exports.parseReturns = parseReturns;
exports.render = render;
exports.copy = copy;
exports.write = write;
exports.getLevel = getLevel;
exports.index = index;
exports.find = find;
exports.clear = clear;
exports.include = include;
exports.create = create;
exports.updateReadme = updateReadme;
