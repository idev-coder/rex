'use strict'

var rex = require('../../');

var app = module.exports = rex()

app.get('/', function(req, res){
  res.send('Hello World');
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Rex started on port 3000');
}
