'use strict'

/**
 * Module dependencies.
 */

var rex = require('../../');
var path = require('path');

var app = module.exports = rex();

// Register ejs as .html. If we did
// not call this, we would need to
// name our views foo.ejs instead
// of foo.html. The __rex method
// is simply a function that engines
// use to hook into the Rex view
// system by default, so if we want
// to change "foo.ejs" to "foo.html"
// we simply pass _any_ function, in this
// case `ejs.__rex`.

app.engine('.html', require('ejs').__express);

// Optional since rex defaults to CWD/views

app.set('views', path.join(__dirname, 'views'));

// Path to our public directory

app.use(rex.static(path.join(__dirname, 'public')));

// Without this you would need to
// supply the extension to res.render()
// ex: res.render('users.html').
app.set('view engine', 'html');

// Dummy users
var users = [
  { name: 'tobi', email: 'tobi@learnboost.com' },
  { name: 'loki', email: 'loki@learnboost.com' },
  { name: 'jane', email: 'jane@learnboost.com' }
];

app.get('/', function(req, res){
  res.render('users', {
    users: users,
    title: "EJS example",
    header: "Some users"
  });
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Rex started on port 3000');
}
