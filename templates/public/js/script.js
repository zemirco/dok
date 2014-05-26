
// add 'language-javascript' to <code> blocks (some already have it)
var codeBlocks = document.getElementsByTagName('code');
for (var i = 0; i < codeBlocks.length; i++) {
  var block = codeBlocks[i];
  block.classList.add('language-javascript');
}
// add hover links to all function headings
var headings = document.getElementsByTagName('h3');
for (var i = 0; i < headings.length; i++) {
  var heading = headings[i];
  var id = heading.getAttribute('id');
  // create anchor link for deep linking to function
  var anchorLink = document.createElement('a');
  anchorLink.href = '#' + id;
  anchorLink.classList.add('link');
  anchorLink.innerHTML = '<i class="fa fa-link"></i>';
  heading.appendChild(anchorLink);
  // create link to github repo code with line number
  var navLink = document.querySelector('a[href="#' + id + '"]');
  var lineno = navLink.getAttribute('data-lineno');
  var sourceLink = document.createElement('a');
  sourceLink.href = '{{repo}}/blob/master/{{main}}#L' + lineno;
  sourceLink.classList.add('source-link');
  sourceLink.innerHTML = '<i class="fa fa-code"></i>';
  sourceLink.target = '_blank';
  heading.appendChild(sourceLink);
}
// highlight
Prism.highlightAll();
