const escapeHtml = require('escape-html');
const fs = require('fs');
const {compile} = require('@mdx-js/mdx');

function createEngine() {

    function renderFile(filename, options, cb) {
        fs.readFile(filename, 'utf8', async function(err, str){
            if (err) return fn(err);
            var compiled  = await compile(str).replace(/\{([^}]+)\}/g, function(_, name){
              return escapeHtml(options[name] || '');
            });
            var html = String(compiled)
            cb(null, html);
          });
    }

    return renderFile
}

module.exports = createEngine;