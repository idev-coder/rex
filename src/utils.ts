import contentType from 'content-type'
import mime from 'mime-types'
import querystring from 'querystring'
import qs from 'qs'
import proxyaddr from 'proxy-addr'

export const setCharset = function setCharset(type, charset) {
    if (!type || !charset) {
        return type;
    }

    // parse type
    var parsed = contentType.parse(type);

    // set charset
    parsed.parameters.charset = charset;

    // format type
    return contentType.format(parsed);
}

export const normalizeType = function (type: any): any {
    return ~type.indexOf('/')
        ? acceptParams(type)
        : { value: (mime.lookup(type) || 'application/octet-stream'), params: {} }
};

export const normalizeTypes = function (types: any[]) {
    var ret: any[] = [];

    for (var i = 0; i < types.length; ++i) {
        ret.push(normalizeType(types[i]));
    }

    return ret;
};

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
}

export const compileQueryParser = function compileQueryParser(val) {
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
            break;
        case 'extended':
            fn = parseExtendedQueryString;
            break;
        default:
            throw new TypeError('unknown value for query parser function: ' + val);
    }

    return fn;
}

export const compileTrust = function (val) {
    if (typeof val === 'function') return val;

    if (val === true) {
        // Support plain true/false
        return function () { return true };
    }

    if (typeof val === 'number') {
        // Support trusting hop count
        return function (a, i) { return i < val };
    }

    if (typeof val === 'string') {
        // Support comma-separated values
        val = val.split(',')
            .map(function (v) { return v.trim() })
    }

    return proxyaddr.compile(val || []);
}


function acceptParams(str) {
    var parts = str.split(/ *; */);
    var ret = { value: parts[0], quality: 1, params: {} }

    for (var i = 1; i < parts.length; ++i) {
        var pms = parts[i].split(/ *= */);
        if ('q' === pms[0]) {
            ret.quality = parseFloat(pms[1]);
        } else {
            ret.params[pms[0]] = pms[1];
        }
    }

    return ret;
}

function parseExtendedQueryString(str) {
    return qs.parse(str, {
        allowPrototypes: true
    });
}