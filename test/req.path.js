'use strict'

var rex = require('../')
  , request = require('supertest');

describe('req', function(){
  describe('.path', function(){
    it('should return the parsed pathname', function(done){
      var app = rex();

      app.use(function(req, res){
        res.end(req.path);
      });

      request(app)
      .get('/login?redirect=/post/1/comments')
      .expect('/login', done);
    })
  })
})
