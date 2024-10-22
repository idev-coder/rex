'use strict'

var assert = require('assert');
var Buffer = require('safe-buffer').Buffer
var utils = require('../lib/utils');

describe('utils.etag(body, encoding)', function(){
  it('should support strings', function(){
    assert.strictEqual(utils.etag('rex!'),
      '"4-YsIlXP3+A32+V4R6IDRCv/TnKAc"')
  })

  it('should support utf8 strings', function(){
    assert.strictEqual(utils.etag('rex❤', 'utf8'),
      '"6-KqlyWlCxjFZZtXiPG+sMiKTeCjs"')
  })

  it('should support buffer', function(){
    assert.strictEqual(utils.etag(Buffer.from('rex!')),
      '"4-YsIlXP3+A32+V4R6IDRCv/TnKAc"')
  })

  it('should support empty string', function(){
    assert.strictEqual(utils.etag(''),
      '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"')
  })
})

describe('utils.setCharset(type, charset)', function () {
  it('should do anything without type', function () {
    assert.strictEqual(utils.setCharset(), undefined);
  });

  it('should return type if not given charset', function () {
    assert.strictEqual(utils.setCharset('text/html'), 'text/html');
  });

  it('should keep charset if not given charset', function () {
    assert.strictEqual(utils.setCharset('text/html; charset=utf-8'), 'text/html; charset=utf-8');
  });

  it('should set charset', function () {
    assert.strictEqual(utils.setCharset('text/html', 'utf-8'), 'text/html; charset=utf-8');
  });

  it('should override charset', function () {
    assert.strictEqual(utils.setCharset('text/html; charset=iso-8859-1', 'utf-8'), 'text/html; charset=utf-8');
  });
});

describe('utils.wetag(body, encoding)', function(){
  it('should support strings', function(){
    assert.strictEqual(utils.wetag('rex!'),
      'W/"4-YsIlXP3+A32+V4R6IDRCv/TnKAc"')
  })

  it('should support utf8 strings', function(){
    assert.strictEqual(utils.wetag('rex❤', 'utf8'),
      'W/"6-KqlyWlCxjFZZtXiPG+sMiKTeCjs"')
  })

  it('should support buffer', function(){
    assert.strictEqual(utils.wetag(Buffer.from('rex!')),
      'W/"4-YsIlXP3+A32+V4R6IDRCv/TnKAc"')
  })

  it('should support empty string', function(){
    assert.strictEqual(utils.wetag(''),
      'W/"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"')
  })
})

describe('utils.isAbsolute()', function(){
  it('should support windows', function(){
    assert(utils.isAbsolute('c:\\'));
    assert(utils.isAbsolute('c:/'));
    assert(!utils.isAbsolute(':\\'));
  })

  it('should support windows unc', function(){
    assert(utils.isAbsolute('\\\\foo\\bar'))
  })

  it('should support unices', function(){
    assert(utils.isAbsolute('/foo/bar'));
    assert(!utils.isAbsolute('foo/bar'));
  })
})

describe('utils.flatten(arr)', function(){
  it('should flatten an array', function(){
    var arr = ['one', ['two', ['three', 'four'], 'five']];
    var flat = utils.flatten(arr)

    assert.strictEqual(flat.length, 5)
    assert.strictEqual(flat[0], 'one')
    assert.strictEqual(flat[1], 'two')
    assert.strictEqual(flat[2], 'three')
    assert.strictEqual(flat[3], 'four')
    assert.strictEqual(flat[4], 'five')
    assert.ok(flat.every(function (v) { return typeof v === 'string' }))
  })
})
