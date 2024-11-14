import http from 'http'
import accepts from 'accepts'
import parseRange from 'range-parser'
import typeis from 'type-is'
import parseUrl from 'parseurl'
import proxyaddr from 'proxy-addr'
import fresh from 'fresh'
import { isIP } from 'net'
import { IRequest } from './types/request'

export var req: IRequest = Object.create(http.IncomingMessage.prototype)

req.get =
  req.header = function header(name) {
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
  }

req.accepts = function () {
  const self: any = this
  var accept = accepts(self);
  var args: any = arguments
  return accept.types.apply(accept, args);
};

req.acceptsEncodings = function () {
  const self: any = this
  var accept = accepts(self);
  var args: any = arguments
  return accept.encodings.apply(accept, args);
};

req.acceptsCharsets = function () {
  const self: any = this
  var accept = accepts(self);
  var args: any = arguments
  return accept.charsets.apply(accept, args);
};

req.acceptsLanguages = function () {
  const self: any = this
  var accept = accepts(self);
  var args: any = arguments
  return accept.languages.apply(accept, args);
};

req.range = function range(size, options) {
  var range = this.get('Range');
  if (!range) return;
  return parseRange(size, range, options);
};

req.is = function is(types) {
  var arr = types;
  const self: any = this
  // support flattened arguments
  if (!Array.isArray(types)) {
    arr = new Array(arguments.length);
    for (var i = 0; i < arr.length; i++) {
      arr[i] = arguments[i];
    }
  }

  return typeis(self, arr);
};

defineGetter(req, 'query', function query(this: any) {

  var queryparse = this.app.get('query parser fn');
  if (!queryparse) {
    // parsing is disabled
    return Object.create(null);
  }

  var querystring = parseUrl(this).query;

  return queryparse(querystring);
});

defineGetter(req, 'protocol', function protocol(this: any) {
  var proto = this.connection.encrypted
    ? 'https'
    : 'http';
  var trust = this.app.get('trust proxy fn');

  if (!trust(this.connection.remoteAddress, 0)) {
    return proto;
  }

  // Note: X-Forwarded-Proto is normally only ever a
  //       single value, but this is to be safe.
  var header = this.get('X-Forwarded-Proto') || proto
  var index = header.indexOf(',')

  return index !== -1
    ? header.substring(0, index).trim()
    : header.trim()
});

defineGetter(req, 'secure', function secure(this: any) {
  return this.protocol === 'https';
});

defineGetter(req, 'ip', function ip(this: any) {
  var trust = this.app.get('trust proxy fn');
  return proxyaddr(this, trust);
});

defineGetter(req, 'ips', function ips(this: any) {
  var trust = this.app.get('trust proxy fn');
  var addrs = proxyaddr.all(this, trust);

  // reverse the order (to farthest -> closest)
  // and remove socket address
  addrs.reverse().pop()

  return addrs
});

defineGetter(req, 'subdomains', function subdomains(this: any) {
  var hostname = this.hostname;

  if (!hostname) return [];

  var offset = this.app.get('subdomain offset');
  var subdomains = !isIP(hostname)
    ? hostname.split('.').reverse()
    : [hostname];

  return subdomains.slice(offset);
});

defineGetter(req, 'path', function path(this: any) {
  return parseUrl(this).pathname;
});

defineGetter(req, 'host', function host(this: any) {
  var trust = this.app.get('trust proxy fn');
  var val = this.get('X-Forwarded-Host');

  if (!val || !trust(this.connection.remoteAddress, 0)) {
    val = this.get('Host');
  } else if (val.indexOf(',') !== -1) {
    // Note: X-Forwarded-Host is normally only ever a
    //       single value, but this is to be safe.
    val = val.substring(0, val.indexOf(',')).trimRight()
  }

  return val || undefined;
});

defineGetter(req, 'hostname', function hostname(this: any) {
  var host = this.host;

  if (!host) return;

  // IPv6 literal support
  var offset = host[0] === '['
    ? host.indexOf(']') + 1
    : 0;
  var index = host.indexOf(':', offset);

  return index !== -1
    ? host.substring(0, index)
    : host;
});

defineGetter(req, 'fresh', function (this: any) {
  var method = this.method;
  var res = this.res
  var status = res.statusCode

  // GET or HEAD for weak freshness validation only
  if ('GET' !== method && 'HEAD' !== method) return false;

  // 2xx or 304 as per rfc2616 14.26
  if ((status >= 200 && status < 300) || 304 === status) {
    return fresh(this.headers, {
      'etag': res.get('ETag'),
      'last-modified': res.get('Last-Modified')
    })
  }

  return false;
});

defineGetter(req, 'stale', function stale(this: any) {
  return !this.fresh;
});

defineGetter(req, 'xhr', function xhr(this: any) {
  var val = this.get('X-Requested-With') || '';
  return val.toLowerCase() === 'xmlhttprequest';
});


function defineGetter(obj: any, name: string, getter: { (): any }) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    get: getter
  });
}

export default req
