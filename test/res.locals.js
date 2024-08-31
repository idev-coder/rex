'use strict'

var rex = require('../')
  , request = require('supertest');

describe('res', function(){
  describe('.locals', function(){
    it('should be empty by default', function(done){
      var app = rex();

      app.use(function(req, res){
        res.json(res.locals)
      });

      request(app)
      .get('/')
      .expect(200, {}, done)
    })
  })

  it('should work when mounted', function(done){
    var app = rex();
    var blog = rex();

    app.use(blog);

    blog.use(function(req, res, next){
      res.locals.foo = 'bar';
      next();
    });

    app.use(function(req, res){
      res.json(res.locals)
    });

    request(app)
    .get('/')
    .expect(200, { foo: 'bar' }, done)
  })
})
