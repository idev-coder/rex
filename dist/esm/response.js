import safeBuffer from 'safe-buffer';
import contentDisposition from 'content-disposition';
import createError from 'http-errors';
import depd from 'depd';
import encodeUrl from 'encodeurl';
import * as http from 'http';
import statuses from 'statuses';
import { isAbsolute, normalizeType, normalizeTypes, setCharset } from './utils';
import send from 'send';
import onFinished from 'on-finished';
import path from 'path';
import merge from 'utils-merge';
import cookieSignature from 'cookie-signature';
import cookie from 'cookie';
import escapeHtml from 'escape-html';
import vary from 'vary';
const resolve = path.resolve;
const extname = path.extname;
const Buffer = safeBuffer.Buffer;
const deprecate = depd('rex');
const mime = send.mime;
const sign = cookieSignature.sign;
export const response = Object.create(http.ServerResponse.prototype);
const charsetRegExp = /;\s*charset\s*=/;
response.status = function status(code) {
    if ((typeof code === 'string' || Math.floor(code) !== code) && code > 99 && code < 1000) {
        deprecate('response.status(' + JSON.stringify(code) + '): use response.status(' + Math.floor(code) + ') instead');
    }
    this.statusCode = code;
    return this;
};
response.links = function (links) {
    var link = this.get('Link') || '';
    if (link)
        link += ', ';
    return this.set('Link', link + Object.keys(links).map(function (rel) {
        return '<' + links[rel] + '>; rel="' + rel + '"';
    }).join(', '));
};
response.send = function (body, ...args) {
    var chunk = body;
    var encoding;
    var req = this.req;
    var type;
    // settings
    var app = this.app;
    // allow status / body
    if (args.length === 2) {
        // response.send(body, status) backwards compat
        if (typeof args[0] !== 'number' && typeof args[1] === 'number') {
            deprecate('response.send(body, status): Use response.status(status).send(body) instead');
            this.statusCode = args[1];
        }
        else {
            deprecate('response.send(status, body): Use response.status(status).send(body) instead');
            this.statusCode = args[0];
            chunk = args[1];
        }
    }
    // disambiguate response.send(status) and response.send(status, num)
    if (typeof chunk === 'number' && arguments.length === 1) {
        // response.send(status) will set status message as text string
        if (!this.get('Content-Type')) {
            this.type('txt');
        }
        deprecate('response.send(status): Use response.sendStatus(status) instead');
        this.statusCode = chunk;
        chunk = statuses.message[chunk];
    }
    switch (typeof chunk) {
        // string defaulting to html
        case 'string':
            if (!this.get('Content-Type')) {
                this.type('html');
            }
            break;
        case 'boolean':
        case 'number':
        case 'object':
            if (chunk === null) {
                chunk = '';
            }
            else if (Buffer.isBuffer(chunk)) {
                if (!this.get('Content-Type')) {
                    this.type('bin');
                }
            }
            else {
                return this.json(chunk);
            }
            break;
    }
    // write strings in utf-8
    if (typeof chunk === 'string') {
        encoding = 'utf8';
        type = this.get('Content-Type');
        // reflect this in content-type
        if (typeof type === 'string') {
            this.set('Content-Type', setCharset(type, 'utf-8'));
        }
    }
    // determine if ETag should be generated
    var etagFn = app.get('etag fn');
    var generateETag = !this.get('ETag') && typeof etagFn === 'function';
    // populate Content-Length
    var len;
    if (chunk !== undefined) {
        if (Buffer.isBuffer(chunk)) {
            // get length of Buffer
            len = chunk.length;
        }
        else if (!generateETag && chunk.length < 1000) {
            // just calculate length when no ETag + small chunk
            len = Buffer.byteLength(chunk, encoding);
        }
        else {
            // convert chunk to Buffer and calculate
            chunk = Buffer.from(chunk, encoding);
            encoding = undefined;
            len = chunk.length;
        }
        this.set('Content-Length', len);
    }
    // populate ETag
    var etag;
    if (generateETag && len !== undefined) {
        if ((etag = etagFn(chunk, encoding))) {
            this.set('ETag', etag);
        }
    }
    // freshness
    if (req.fresh)
        this.statusCode = 304;
    // strip irrelevant headers
    if (204 === this.statusCode || 304 === this.statusCode) {
        this.removeHeader('Content-Type');
        this.removeHeader('Content-Length');
        this.removeHeader('Transfer-Encoding');
        chunk = '';
    }
    // alter headers for 205
    if (this.statusCode === 205) {
        this.set('Content-Length', '0');
        this.removeHeader('Transfer-Encoding');
        chunk = '';
    }
    if (req.method === 'HEAD') {
        // skip body for HEAD
        this.end();
    }
    else {
        // respond
        this.end(chunk, encoding);
    }
    return this;
};
response.json = function (obj, ...args) {
    var val = obj;
    // allow status / body
    if (args.length === 2) {
        // response.json(body, status) backwards compat
        if (typeof args[1] === 'number') {
            deprecate('response.json(obj, status): Use response.status(status).json(obj) instead');
            this.statusCode = args[1];
        }
        else {
            deprecate('response.json(status, obj): Use response.status(status).json(obj) instead');
            this.statusCode = args[0];
            val = args[1];
        }
    }
    // settings
    var app = this.app;
    var escape = app.get('json escape');
    var replacer = app.get('json replacer');
    var spaces = app.get('json spaces');
    var body = stringify(val, replacer, spaces, escape);
    // content-type
    if (!this.get('Content-Type')) {
        this.set('Content-Type', 'application/json');
    }
    return this.send(body);
};
response.jsonp = function (obj, ...args) {
    var val = obj;
    // allow status / body
    if (args.length === 2) {
        // response.jsonp(body, status) backwards compat
        if (typeof args[1] === 'number') {
            deprecate('response.jsonp(obj, status): Use response.status(status).jsonp(obj) instead');
            this.statusCode = args[1];
        }
        else {
            deprecate('response.jsonp(status, obj): Use response.status(status).jsonp(obj) instead');
            this.statusCode = args[0];
            val = args[1];
        }
    }
    // settings
    var app = this.app;
    var escape = app.get('json escape');
    var replacer = app.get('json replacer');
    var spaces = app.get('json spaces');
    var body = stringify(val, replacer, spaces, escape);
    var callback = this.req.query[app.get('jsonp callback name')];
    // content-type
    if (!this.get('Content-Type')) {
        this.set('X-Content-Type-Options', 'nosniff');
        this.set('Content-Type', 'application/json');
    }
    // fixup callback
    if (Array.isArray(callback)) {
        callback = callback[0];
    }
    // jsonp
    if (typeof callback === 'string' && callback.length !== 0) {
        this.set('X-Content-Type-Options', 'nosniff');
        this.set('Content-Type', 'text/javascript');
        // restrict callback charset
        callback = callback.replace(/[^\[\]\w$.]/g, '');
        if (body === undefined) {
            // empty argument
            body = '';
        }
        else if (typeof body === 'string') {
            // replace chars not allowed in JavaScript that are in JSON
            body = body
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029');
        }
        // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
        // the typeof check is just to reduce client error noise
        body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');';
    }
    return this.send(body);
};
response.sendStatus = function (statusCode) {
    var body = statuses.message[statusCode] || String(statusCode);
    this.statusCode = statusCode;
    this.type('txt');
    return this.send(body);
};
response.sendFile = function (path, options, callback) {
    var done = callback;
    var req = this.req;
    var res = this;
    var next = req.next;
    var opts = options || {};
    if (!path) {
        throw new TypeError('path argument is required to response.sendFile');
    }
    if (typeof path !== 'string') {
        throw new TypeError('path must be a string to response.sendFile');
    }
    // support function as second arg
    if (typeof options === 'function') {
        done = options;
        opts = {};
    }
    if (!opts.root && !isAbsolute(path)) {
        throw new TypeError('path must be absolute or specify root to response.sendFile');
    }
    // create file stream
    var pathname = encodeURI(path);
    var file = send(req, pathname, opts);
    // transfer
    sendfile(res, file, opts, function (err) {
        if (done)
            return done(err);
        if (err && err.code === 'EISDIR')
            return next();
        // next() all but write errors
        if (err && err.code !== 'ECONNABORTED' && err.syscall !== 'write') {
            next(err);
        }
    });
};
response.sendfile = function (path, options, callback) {
    var done = callback;
    var req = this.req;
    var res = this;
    var next = req.next;
    var opts = options || {};
    // support function as second arg
    if (typeof options === 'function') {
        done = options;
        opts = {};
    }
    // create file stream
    var file = send(req, path, opts);
    // transfer
    sendfile(res, file, opts, function (err) {
        if (done)
            return done(err);
        if (err && err.code === 'EISDIR')
            return next();
        // next() all but write errors
        if (err && err.code !== 'ECONNABORTED' && err.syscall !== 'write') {
            next(err);
        }
    });
};
response.sendfile = deprecate.function(response.sendfile, 'response.sendfile: Use response.sendFile instead');
response.download = function (path, filename, options, callback) {
    var done = callback;
    var name = filename;
    var opts = options || null;
    // support function as second or third arg
    if (typeof filename === 'function') {
        done = filename;
        name = null;
        opts = null;
    }
    else if (typeof options === 'function') {
        done = options;
        opts = null;
    }
    // support optional filename, where options may be in it's place
    if (typeof filename === 'object' &&
        (typeof options === 'function' || options === undefined)) {
        name = null;
        opts = filename;
    }
    // set Content-Disposition when file is sent
    var headers = {
        'Content-Disposition': contentDisposition(name || path)
    };
    // merge user-provided headers
    if (opts && opts.headers) {
        var keys = Object.keys(opts.headers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.toLowerCase() !== 'content-disposition') {
                headers[key] = opts.headers[key];
            }
        }
    }
    // merge user-provided options
    opts = Object.create(opts);
    opts.headers = headers;
    // Resolve the full path for sendFile
    var fullPath = !opts.root
        ? resolve(path)
        : path;
    // send file
    return this.sendFile(fullPath, opts, done);
};
response.contentType = response.type = function (type) {
    var ct = type.indexOf('/') === -1
        ? mime.lookup(type)
        : type;
    return this.set('Content-Type', ct);
};
response.format = function (obj) {
    var req = this.req;
    var next = req.next;
    var keys = Object.keys(obj)
        .filter(function (v) { return v !== 'default'; });
    var key = keys.length > 0
        ? req.accepts(keys)
        : false;
    this.vary("Accept");
    if (key) {
        this.set('Content-Type', normalizeType(key).value);
        obj[key](req, this, next);
    }
    else if (obj.default) {
        obj.default(req, this, next);
    }
    else {
        next(createError(406, {
            types: normalizeTypes(keys).map(function (o) { return o.value; })
        }));
    }
    return this;
};
response.attachment = function (filename) {
    if (filename) {
        this.type(extname(filename));
    }
    this.set('Content-Disposition', contentDisposition(filename));
    return this;
};
response.append = function (field, val) {
    var prev = this.get(field);
    var value = val;
    if (prev) {
        // concat the new and prev vals
        value = Array.isArray(prev) ? prev.concat(val)
            : Array.isArray(val) ? [prev].concat(val)
                : [prev, val];
    }
    return this.set(field, value);
};
response.set = response.header = function (field, val, ...args) {
    if (args.length === 2) {
        var value = Array.isArray(val)
            ? val.map(String)
            : String(val);
        // add charset to content-type
        if (field.toLowerCase() === 'content-type') {
            if (Array.isArray(value)) {
                throw new TypeError('Content-Type cannot be set to an Array');
            }
            if (!charsetRegExp.test(value)) {
                var charset = mime.charsets.lookup(value.split(';')[0], "");
                if (charset)
                    value += '; charset=' + charset.toLowerCase();
            }
        }
        this.setHeader(field, value);
    }
    else {
        for (var key in field) {
            this.set(key, field[key]);
        }
    }
    return this;
};
response.get = function (field) {
    return this.getHeader(field);
};
response.clearCookie = function (name, options) {
    if (options) {
        if (options.maxAge) {
            deprecate('response.clearCookie: Passing "options.maxAge" is deprecated. In v5.0.0 of Rex, this option will be ignored, as response.clearCookie will automatically set cookies to expire immediately. Please update your code to omit this option.');
        }
        if (options.expires) {
            deprecate('response.clearCookie: Passing "options.expires" is deprecated. In v5.0.0 of Rex, this option will be ignored, as response.clearCookie will automatically set cookies to expire immediately. Please update your code to omit this option.');
        }
    }
    var opts = merge({ expires: new Date(1), path: '/' }, options);
    return this.cookie(name, '', opts);
};
response.cookie = function (name, value, options) {
    var opts = merge({}, options);
    var secret = this.req.secret;
    var signed = opts.signed;
    if (signed && !secret) {
        throw new Error('cookieParser("secret") required for signed cookies');
    }
    var val = typeof value === 'object'
        ? 'j:' + JSON.stringify(value)
        : String(value);
    if (signed) {
        val = 's:' + sign(val, secret);
    }
    if (opts.maxAge != null) {
        var maxAge = opts.maxAge - 0;
        if (!isNaN(maxAge)) {
            opts.expires = new Date(Date.now() + maxAge);
            opts.maxAge = Math.floor(maxAge / 1000);
        }
    }
    if (opts.path == null) {
        opts.path = '/';
    }
    this.append('Set-Cookie', cookie.serialize(name, String(val), opts));
    return this;
};
response.location = function (url) {
    var loc;
    // "back" is an alias for the referrer
    if (url === 'back') {
        loc = this.req.get('Referrer') || '/';
    }
    else {
        loc = String(url);
    }
    return this.set('Location', encodeUrl(loc));
};
response.redirect = function (url, ...args) {
    var address = url;
    var body;
    var status = 302;
    // allow status / url
    if (args.length === 2) {
        if (typeof args[0] === 'number') {
            status = args[0];
            address = args[1];
        }
        else {
            deprecate('response.redirect(url, status): Use response.redirect(status, url) instead');
            status = args[1];
        }
    }
    // Set location header
    address = this.location(address).get('Location');
    // Support text/{plain,html} by default
    this.format({
        text: function () {
            body = statuses.message[status] + '. Redirecting to ' + address;
        },
        html: function () {
            var u = escapeHtml(address);
            body = '<p>' + statuses.message[status] + '. Redirecting to <a href="' + u + '">' + u + '</a></p>';
        },
        default: function () {
            body = '';
        }
    });
    // Respond
    this.statusCode = status;
    this.set('Content-Length', Buffer.byteLength(body));
    if (this.req.method === 'HEAD') {
        this.end();
    }
    else {
        this.end(body);
    }
};
response.vary = function (field) {
    // checks for back-compat
    if (!field || (Array.isArray(field) && !field.length)) {
        deprecate('response.vary(): Provide a field name');
        return this;
    }
    vary(this, field);
    return this;
};
response.render = function (view, options, callback) {
    var app = this.req.app;
    var done = callback;
    var opts = options || {};
    var req = this.req;
    var self = this;
    // support callback function as second arg
    if (typeof options === 'function') {
        done = options;
        opts = {};
    }
    // merge response.locals
    opts._locals = self.locals;
    // default callback to respond
    done = done || function (err, str) {
        if (err)
            return req.next(err);
        self.send(str);
    };
    // render
    app.render(view, opts, done);
};
function stringify(value, replacer, spaces, escape) {
    // v8 checks arguments.length for optimizing simple call
    // https://bugs.chromium.org/p/v8/issues/detail?id=4730
    var json = replacer || spaces
        ? JSON.stringify(value, replacer, spaces)
        : JSON.stringify(value);
    if (escape && typeof json === 'string') {
        json = json.replace(/[<>&]/g, function (c) {
            switch (c.charCodeAt(0)) {
                case 0x3c:
                    return '\\u003c';
                case 0x3e:
                    return '\\u003e';
                case 0x26:
                    return '\\u0026';
                /* istanbul ignore next: unreachable default */
                default:
                    return c;
            }
        });
    }
    return json;
}
function sendfile(res, file, options, callback) {
    var done = false;
    var streaming;
    // request aborted
    function onaborted() {
        if (done)
            return;
        done = true;
        var err = new Error('Request aborted');
        err.code = 'ECONNABORTED';
        callback(err);
    }
    // directory
    function ondirectory() {
        if (done)
            return;
        done = true;
        var err = new Error('EISDIR, read');
        err.code = 'EISDIR';
        callback(err);
    }
    // errors
    function onerror(err) {
        if (done)
            return;
        done = true;
        callback(err);
    }
    // ended
    function onend() {
        if (done)
            return;
        done = true;
        callback();
    }
    // file
    function onfile() {
        streaming = false;
    }
    // finished
    function onfinish(err) {
        if (err && err.code === 'ECONNRESET')
            return onaborted();
        if (err)
            return onerror(err);
        if (done)
            return;
        setImmediate(function () {
            if (streaming !== false && !done) {
                onaborted();
                return;
            }
            if (done)
                return;
            done = true;
            callback();
        });
    }
    // streaming
    function onstream() {
        streaming = true;
    }
    file.on('directory', ondirectory);
    file.on('end', onend);
    file.on('error', onerror);
    file.on('file', onfile);
    file.on('stream', onstream);
    onFinished(res, onfinish);
    if (options.headers) {
        // set headers on successful transfer
        file.on('headers', function headers(res) {
            var obj = options.headers;
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                response.setHeader(k, obj[k]);
            }
        });
    }
    // pipe
    file.pipe(res);
}
export default response;
