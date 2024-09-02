import contentType from 'content-type';
import depd from 'depd';
import * as arrayFlatten from 'array-flatten';
import send from 'send';
import contentDispos from 'content-disposition';
import querystring from 'querystring';
import qs from 'qs';
import proxyaddr from 'proxy-addr';
const mime = send.mime;
const deprecate = depd('rex');
export const etag = createETagGenerator({ weak: false });
export const wetag = createETagGenerator({ weak: true });
export const isAbsolute = function (path) {
    if ('/' === path[0])
        return true;
    if (':' === path[1] && ('\\' === path[2] || '/' === path[2]))
        return true; // Windows device path
    if ('\\\\' === path.substring(0, 2))
        return true; // Microsoft Azure absolute path 
};
export const flatten = deprecate.function(arrayFlatten.flatten, 'utils.flatten: use array-flatten npm module instead');
export const normalizeType = function (type) {
    return ~type.indexOf('/')
        ? acceptParams(type)
        : { value: mime.lookup(type), params: {} };
};
export const normalizeTypes = function (types) {
    var ret = [];
    for (var i = 0; i < types.length; ++i) {
        ret.push(exports.normalizeType(types[i]));
    }
    return ret;
};
export const contentDisposition = deprecate.function(contentDispos, 'utils.contentDisposition: use content-disposition npm module instead');
export const compileETag = function (val) {
    var fn;
    if (typeof val === 'function') {
        return val;
    }
    switch (val) {
        case true:
        case 'weak':
            fn = exports.wetag;
            break;
        case false:
            break;
        case 'strong':
            fn = exports.etag;
            break;
        default:
            throw new TypeError('unknown value for etag function: ' + val);
    }
    return fn;
};
export const compileQueryParser = function (val) {
    var fn;
    if (typeof val === 'function') {
        return val;
    }
    switch (val) {
        case true:
        case 'simple':
            fn = querystring.parse;
            break;
        case false:
            fn = newObject;
            break;
        case 'extended':
            fn = parseExtendedQueryString;
            break;
        default:
            throw new TypeError('unknown value for query parser function: ' + val);
    }
    return fn;
};
export const compileTrust = function (val) {
    if (typeof val === 'function')
        return val;
    if (val === true) {
        // Support plain true/false
        return function () { return true; };
    }
    if (typeof val === 'number') {
        // Support trusting hop count
        return function (a, i) { return i < val; };
    }
    if (typeof val === 'string') {
        // Support comma-separated values
        val = val.split(',')
            .map(function (v) { return v.trim(); });
    }
    return proxyaddr.compile(val || []);
};
export const setCharset = function (type, charset) {
    if (!type || !charset) {
        return type;
    }
    // parse type
    var parsed = contentType.parse(type);
    // set charset
    parsed.parameters.charset = charset;
    // format type
    return contentType.format(parsed);
};
function createETagGenerator(options) {
    return function generateETag(body, encoding) {
        var buf = !Buffer.isBuffer(body)
            ? Buffer.from(body, encoding)
            : body;
        return etag(buf, options);
    };
}
function acceptParams(str) {
    var parts = str.split(/ *; */);
    var ret = { value: parts[0], quality: 1, params: {} };
    for (var i = 1; i < parts.length; ++i) {
        var pms = parts[i].split(/ *= */);
        if ('q' === pms[0]) {
            ret.quality = parseFloat(pms[1]);
        }
        else {
            ret.params[pms[0]] = pms[1];
        }
    }
    return ret;
}
function newObject() {
    return {};
}
function parseExtendedQueryString(str) {
    return qs.parse(str, {
        allowPrototypes: true
    });
}
