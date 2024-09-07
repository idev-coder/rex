const escapeHtml = require('escape-html');
const fs = require('fs');
const marked = require('marked');


function createEngine() {
    function renderFile(filename, options, cb) {
        fs.readFile(filename, 'utf8', function(err, str){
            if (err) return fn(err);
            var html = marked.parse(str).replace(/\{([^}]+)\}/g, function(_, name){
              return escapeHtml(options[name] || '');
            });
            cb(null, html);
          });
    }

    return renderFile
}

module.exports = createEngine;