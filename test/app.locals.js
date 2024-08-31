'use strict'

var assert = require('assert')
var rex = require('../')

describe('app', function(){
  describe('.locals', function () {
    it('should default object', function () {
      var app = rex()
      assert.ok(app.locals)
      assert.strictEqual(typeof app.locals, 'object')
    })

    describe('.settings', function () {
      it('should contain app settings ', function () {
        var app = rex()
        app.set('title', 'Rex')
        assert.ok(app.locals.settings)
        assert.strictEqual(typeof app.locals.settings, 'object')
        assert.strictEqual(app.locals.settings, app.settings)
        assert.strictEqual(app.locals.settings.title, 'Rex')
      })
    })
  })
})
