'use strict'

var rex = require('../')

describe('app.listen()', function(){
  it('should wrap with an HTTP server', function(done){
    var app = rex();

    var server = app.listen(0, function () {
      server.close(done)
    });
  })
})
