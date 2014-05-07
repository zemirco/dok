
var fs = require('fs');
var shell = require('shelljs');
var handlebars = require('handlebars');
var marked = require('marked');
var mkdirp = require('mkdirp');

/**
 * Internal helper functions
 */

String.prototype.p = function() {
  return this.replace(/<\/?p>/g, '');
};

String.prototype.code = function() {
  return this.replace(/<\/?code>/g, '`');
};

/**
 * Generate docs JSON by using patched JSDoc haruki template.
 *
 * @param {String} file - JavaScript file with comments to parse
 * @return {Object} JSON representation of all comments in file
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
 * Generates string with comma separated function arguments.
 * Wraps optional parameters in square brackets.
 * Ignores child parameters like `config.key`.
 *
 * @param {Object} docs - JSON documentation
 * @returns {String} Comma separated arguments
 */
function args(fn) {
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
 * Generate GitHub flavoured markdown description from JSDoc description.
 * Replace `code` tags with markdown code tags.
 *
 * @param {String} desc - JSDoc description string
 * @returns {String} Markdown description
 */
function description(desc) {
  if (!desc) return;
  return desc.p().code();
}

/**
 * Generate GitHub flavoured markdown compatible code block from JSDoc parsed
 * examples array.
 *
 * @param {Array} examples - JSDoc examples array
 * @returns {Array} GitHub flavoured markdown fenced code blocks
 */
function examples(xmpls) {
  if (!xmpls) return;
  var res = xmpls.map(function(ex) {
    // get caption
    var match = /(`.+`\n)/.exec(ex);
    var caption = (match) ? match[1] : '';
    // remove caption from code - with potential second line break
    var re = new RegExp(caption + '\n?');
    var code = ex.replace(re, '');
    // generate code block
    return caption + '```javascript\n' + code + '\n```';
  });
  return res;
}

/**
 * Generate markdown list item from parameter object
 *
 * @param {Object} prm - Single parameter object from JSDoc
 * @returns {String} Markdown list item
 */
function params(prms) {
  if (!prms) return;
  var res = prms.map(function(param) {
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
  return res;
}


/**
 * Generate markdown return block
 *
 * @example
   `docs.json`

   {
     type: 'String',
     description: '<p>Some description here</p>'
   }
 *
 * @example
   `index.js`

   var docs = require('./docs.json');
   console.log(returns(docs));
   // - **String** - Some description here
 *
 * @param {Object} returns - Returns object from JSDoc
 * @returns {String} Markdown formatted list item
 */
function returns(rtrns) {
  if (!rtrns) return;
  var type = '- **' + rtrns.type + '**';
  var desc = rtrns.description ? ' - ' + rtrns.description.p() : '';
  var res = type + desc;
  return res;
}

// render index.hbs.html to index.html
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

// copy css and js folders to target ./docs/ folder
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
 * Write markdown files for each function
 */
module.exports = function(file) {
  var source = fs.readFileSync(__dirname + '/templates/function.hbs.md', 'utf8');
  var template = handlebars.compile(source);
  // generate json docs
  var docs = jsdoc(file);
  if (!docs.functions) return;
  docs.functions.forEach(function(fn) {
    // create some data for handlebars template
    var locals = {
      name: fn.name,
      args: args(fn),
      description: description(fn.description),
      parameters: params(fn.parameters),
      returns: returns(fn.returns),
      examples: examples(fn.examples)
    };
    // generate markdown file for each function
    var markdown = template(locals);
    // write markdown files
    var cwd = process.cwd();
    mkdirp.sync(cwd + '/docs/includes');
    fs.writeFileSync(cwd + '/docs/includes/' + fn.name + '.md', markdown);

  });
  render(docs.functions);
  copy();
};
