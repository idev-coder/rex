import * as http from 'http';
import accepts from 'accepts';
import depd from 'depd';
import parseRange from 'range-parser';
import typeis from 'type-is';
import proxyaddr from 'proxy-addr';
import net from 'net';
import parse from 'parseurl';
import fresh from 'fresh';
const deprecate = depd('rex');
const isIP = net.isIP;
export const request = Object.create(http.IncomingMessage.prototype);
request.get = request.header = function (name) {
    if (!name) {
        throw new TypeError('name argument is required to req.get');
    }
    if (typeof name !== 'string') {
        throw new TypeError('name must be a string to req.get');
    }
    var lc = name.toLowerCase();
    switch (lc) {
        case 'referer':
        case 'referrer':
            return this.headers.referrer
                || this.headers.referer;
        default:
            return this.headers[lc];
    }
};
request.accepts = function (...args) {
    var accept = accepts(this);
    return accept.types.apply(accept, args);
};
request.acceptsEncodings = function (...args) {
    var accept = accepts(this);
    return accept.encodings.apply(accept, args);
};
request.acceptsEncoding = deprecate.function(request.acceptsEncodings, 'request.acceptsEncoding: Use acceptsEncodings instead');
request.acceptsCharsets = function (...args) {
    var accept = accepts(this);
    return accept.charsets.apply(accept, args);
};
request.acceptsCharset = deprecate.function(request.acceptsCharsets, 'request.acceptsCharset: Use acceptsCharsets instead');
request.acceptsLanguages = function (...args) {
    var accept = accepts(this);
    return accept.languages.apply(accept, args);
};
request.acceptsLanguage = deprecate.function(request.acceptsLanguages, 'request.acceptsLanguage: Use acceptsLanguages instead');
request.range = function (size, options) {
    var range = this.get('Range');
    if (!range)
        return;
    return parseRange(size, range, options);
};
request.param = function (name, defaultValue, ...args) {
    var params = this.params || {};
    var body = this.body || {};
    var query = this.query || {};
    var newArgs = args.length === 1
        ? 'name'
        : 'name, default';
    deprecate('req.param(' + newArgs + '): Use req.params, req.body, or req.query instead');
    if (null != params[name] && params.hasOwnProperty(name))
        return params[name];
    if (null != body[name])
        return body[name];
    if (null != query[name])
        return query[name];
    return defaultValue;
};
request.is = function (types, ...args) {
    var arr = types;
    // support flattened arguments
    if (!Array.isArray(types)) {
        arr = new Array(args.length);
        for (var i = 0; i < arr.length; i++) {
            arr[i] = args[i];
        }
    }
    return typeis(this, arr);
};
defineGetter(request, 'protocol', function () {
    var proto = this.connection.encrypted
        ? 'https'
        : 'http';
    var trust = this.app.get('trust proxy fn');
    if (!trust(this.connection.remoteAddress, 0)) {
        return proto;
    }
    // Note: X-Forwarded-Proto is normally only ever a
    //       single value, but this is to be safe.
    var header = this.get('X-Forwarded-Proto') || proto;
    var index = header.indexOf(',');
    return index !== -1
        ? header.substring(0, index).trim()
        : header.trim();
});
defineGetter(request, 'secure', function () {
    return this.protocol === 'https';
});
defineGetter(request, 'ip', function () {
    var trust = this.app.get('trust proxy fn');
    return proxyaddr(this, trust);
});
defineGetter(request, 'ips', function () {
    var trust = this.app.get('trust proxy fn');
    var addrs = proxyaddr.all(this, trust);
    // reverse the order (to farthest -> closest)
    // and remove socket address
    addrs.reverse().pop();
    return addrs;
});
defineGetter(request, 'subdomains', function () {
    var hostname = this.hostname;
    if (!hostname)
        return [];
    var offset = this.app.get('subdomain offset');
    var subdomains = !isIP(hostname)
        ? hostname.split('.').reverse()
        : [hostname];
    return subdomains.slice(offset);
});
defineGetter(request, 'path', function () {
    return parse(this).pathname;
});
defineGetter(request, 'hostname', function () {
    var trust = this.app.get('trust proxy fn');
    var host = this.get('X-Forwarded-Host');
    if (!host || !trust(this.connection.remoteAddress, 0)) {
        host = this.get('Host');
    }
    else if (host.indexOf(',') !== -1) {
        // Note: X-Forwarded-Host is normally only ever a
        //       single value, but this is to be safe.
        host = host.substring(0, host.indexOf(',')).trimRight();
    }
    if (!host)
        return;
    // IPv6 literal support
    var offset = host[0] === '['
        ? host.indexOf(']') + 1
        : 0;
    var index = host.indexOf(':', offset);
    return index !== -1
        ? host.substring(0, index)
        : host;
});
defineGetter(request, 'host', deprecate.function(function () {
    return this.hostname;
}, 'request.host: Use req.hostname instead'));
defineGetter(request, 'fresh', function () {
    var method = this.method;
    var res = this.res;
    var status = res.statusCode;
    // GET or HEAD for weak freshness validation only
    if ('GET' !== method && 'HEAD' !== method)
        return false;
    // 2xx or 304 as per rfc2616 14.26
    if ((status >= 200 && status < 300) || 304 === status) {
        return fresh(this.headers, {
            'etag': res.get('ETag'),
            'last-modified': res.get('Last-Modified')
        });
    }
    return false;
});
defineGetter(request, 'stale', function () {
    return !this.fresh;
});
defineGetter(request, 'xhr', function () {
    var val = this.get('X-Requested-With') || '';
    return val.toLowerCase() === 'xmlhttprequest';
});
function defineGetter(obj, name, getter) {
    Object.defineProperty(obj, name, {
        configurable: true,
        enumerable: true,
        get: getter
    });
}
export default request;
