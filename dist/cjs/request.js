"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = void 0;
const http = __importStar(require("http"));
const accepts_1 = __importDefault(require("accepts"));
const depd_1 = __importDefault(require("depd"));
const range_parser_1 = __importDefault(require("range-parser"));
const type_is_1 = __importDefault(require("type-is"));
const proxy_addr_1 = __importDefault(require("proxy-addr"));
const net_1 = __importDefault(require("net"));
const parseurl_1 = __importDefault(require("parseurl"));
const fresh_1 = __importDefault(require("fresh"));
const deprecate = (0, depd_1.default)('rex');
const isIP = net_1.default.isIP;
exports.request = Object.create(http.IncomingMessage.prototype);
exports.request.get = exports.request.header = function (name) {
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
exports.request.accepts = function (...args) {
    var accept = (0, accepts_1.default)(this);
    return accept.types.apply(accept, args);
};
exports.request.acceptsEncodings = function (...args) {
    var accept = (0, accepts_1.default)(this);
    return accept.encodings.apply(accept, args);
};
exports.request.acceptsEncoding = deprecate.function(exports.request.acceptsEncodings, 'request.acceptsEncoding: Use acceptsEncodings instead');
exports.request.acceptsCharsets = function (...args) {
    var accept = (0, accepts_1.default)(this);
    return accept.charsets.apply(accept, args);
};
exports.request.acceptsCharset = deprecate.function(exports.request.acceptsCharsets, 'request.acceptsCharset: Use acceptsCharsets instead');
exports.request.acceptsLanguages = function (...args) {
    var accept = (0, accepts_1.default)(this);
    return accept.languages.apply(accept, args);
};
exports.request.acceptsLanguage = deprecate.function(exports.request.acceptsLanguages, 'request.acceptsLanguage: Use acceptsLanguages instead');
exports.request.range = function (size, options) {
    var range = this.get('Range');
    if (!range)
        return;
    return (0, range_parser_1.default)(size, range, options);
};
exports.request.param = function (name, defaultValue, ...args) {
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
exports.request.is = function (types, ...args) {
    var arr = types;
    // support flattened arguments
    if (!Array.isArray(types)) {
        arr = new Array(args.length);
        for (var i = 0; i < arr.length; i++) {
            arr[i] = args[i];
        }
    }
    return (0, type_is_1.default)(this, arr);
};
defineGetter(exports.request, 'protocol', function () {
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
defineGetter(exports.request, 'secure', function () {
    return this.protocol === 'https';
});
defineGetter(exports.request, 'ip', function () {
    var trust = this.app.get('trust proxy fn');
    return (0, proxy_addr_1.default)(this, trust);
});
defineGetter(exports.request, 'ips', function () {
    var trust = this.app.get('trust proxy fn');
    var addrs = proxy_addr_1.default.all(this, trust);
    // reverse the order (to farthest -> closest)
    // and remove socket address
    addrs.reverse().pop();
    return addrs;
});
defineGetter(exports.request, 'subdomains', function () {
    var hostname = this.hostname;
    if (!hostname)
        return [];
    var offset = this.app.get('subdomain offset');
    var subdomains = !isIP(hostname)
        ? hostname.split('.').reverse()
        : [hostname];
    return subdomains.slice(offset);
});
defineGetter(exports.request, 'path', function () {
    return (0, parseurl_1.default)(this).pathname;
});
defineGetter(exports.request, 'hostname', function () {
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
defineGetter(exports.request, 'host', deprecate.function(function () {
    return this.hostname;
}, 'request.host: Use req.hostname instead'));
defineGetter(exports.request, 'fresh', function () {
    var method = this.method;
    var res = this.res;
    var status = res.statusCode;
    // GET or HEAD for weak freshness validation only
    if ('GET' !== method && 'HEAD' !== method)
        return false;
    // 2xx or 304 as per rfc2616 14.26
    if ((status >= 200 && status < 300) || 304 === status) {
        return (0, fresh_1.default)(this.headers, {
            'etag': res.get('ETag'),
            'last-modified': res.get('Last-Modified')
        });
    }
    return false;
});
defineGetter(exports.request, 'stale', function () {
    return !this.fresh;
});
defineGetter(exports.request, 'xhr', function () {
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
exports.default = exports.request;
