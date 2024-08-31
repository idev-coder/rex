'use strict'

var rex = require('../../..');

var apiv1 = rex.Router();

apiv1.get('/', function(req, res) {
  res.send('Hello from APIv1 root route.');
});

apiv1.get('/users', function(req, res) {
  res.send('List of APIv1 users.');
});

module.exports = apiv1;
