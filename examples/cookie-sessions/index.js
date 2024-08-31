'use strict'

/**
 * Module dependencies.
 */

var cookieSession = require('cookie-session');
var rex = require('../../');

var app = module.exports = rex();

// add req.session cookie support
app.use(cookieSession({ secret: 'manny is cool' }));

// do something with the session
app.get('/', function (req, res) {
  req.session.count = (req.session.count || 0) + 1
  res.send('viewed ' + req.session.count + ' times\n')
})

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Rex started on port 3000');
}
