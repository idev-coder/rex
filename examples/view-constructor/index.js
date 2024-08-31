'use strict'

/**
 * Module dependencies.
 */

var rex = require('../../');
var GithubView = require('./github-view');
var md = require('marked').parse;

var app = module.exports = rex();

// register .md as an engine in rex view system
app.engine('md', function(str, options, fn){
  try {
    var html = md(str);
    html = html.replace(/\{([^}]+)\}/g, function(_, name){
      return options[name] || '';
    });
    fn(null, html);
  } catch(err) {
    fn(err);
  }
});

// pointing to a particular github repo to load files from it
app.set('views', 'idev-coder/rex');

// register a new view constructor
app.set('view', GithubView);

app.get('/', function(req, res){
  // rendering a view relative to the repo.
  // app.locals, res.locals, and locals passed
  // work like they normally would
  res.render('examples/markdown/views/index.md', { title: 'Example' });
});

app.get('/Readme.md', function(req, res){
  // rendering a view from https://github.com/rexjs/rex/blob/master/Readme.md
  res.render('Readme.md');
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Rex started on port 3000');
}
