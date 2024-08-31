'use strict'

var assert = require('assert')
var rex = require('../');
var request = require('supertest');

describe('exports', function(){
  it('should expose Router', function(){
    assert.strictEqual(typeof rex.Router, 'function')
  })

  it('should expose json middleware', function () {
    assert.equal(typeof rex.json, 'function')
    assert.equal(rex.json.length, 1)
  })

  it('should expose raw middleware', function () {
    assert.equal(typeof rex.raw, 'function')
    assert.equal(rex.raw.length, 1)
  })

  it('should expose static middleware', function () {
    assert.equal(typeof rex.static, 'function')
    assert.equal(rex.static.length, 2)
  })

  it('should expose text middleware', function () {
    assert.equal(typeof rex.text, 'function')
    assert.equal(rex.text.length, 1)
  })

  it('should expose urlencoded middleware', function () {
    assert.equal(typeof rex.urlencoded, 'function')
    assert.equal(rex.urlencoded.length, 1)
  })

  it('should expose the application prototype', function(){
    assert.strictEqual(typeof rex.application, 'object')
    assert.strictEqual(typeof rex.application.set, 'function')
  })

  it('should expose the request prototype', function(){
    assert.strictEqual(typeof rex.request, 'object')
    assert.strictEqual(typeof rex.request.accepts, 'function')
  })

  it('should expose the response prototype', function(){
    assert.strictEqual(typeof rex.response, 'object')
    assert.strictEqual(typeof rex.response.send, 'function')
  })

  it('should permit modifying the .application prototype', function(){
    rex.application.foo = function(){ return 'bar'; };
    assert.strictEqual(rex().foo(), 'bar')
  })

  it('should permit modifying the .request prototype', function(done){
    rex.request.foo = function(){ return 'bar'; };
    var app = rex();

    app.use(function(req, res, next){
      res.end(req.foo());
    });

    request(app)
    .get('/')
    .expect('bar', done);
  })

  it('should permit modifying the .response prototype', function(done){
    rex.response.foo = function(){ this.send('bar'); };
    var app = rex();

    app.use(function(req, res, next){
      res.foo();
    });

    request(app)
    .get('/')
    .expect('bar', done);
  })

  it('should throw on old middlewares', function(){
    assert.throws(function () { rex.bodyParser() }, /Error:.*middleware.*bodyParser/)
    assert.throws(function () { rex.limit() }, /Error:.*middleware.*limit/)
  })
})
