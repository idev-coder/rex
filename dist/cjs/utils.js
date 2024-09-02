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
exports.setCharset = exports.compileTrust = exports.compileQueryParser = exports.compileETag = exports.contentDisposition = exports.normalizeTypes = exports.normalizeType = exports.flatten = exports.isAbsolute = exports.wetag = exports.etag = void 0;
const content_type_1 = __importDefault(require("content-type"));
const depd_1 = __importDefault(require("depd"));
const arrayFlatten = __importStar(require("array-flatten"));
const send_1 = __importDefault(require("send"));
const content_disposition_1 = __importDefault(require("content-disposition"));
const querystring_1 = __importDefault(require("querystring"));
const qs_1 = __importDefault(require("qs"));
const proxy_addr_1 = __importDefault(require("proxy-addr"));
const mime = send_1.default.mime;
const deprecate = (0, depd_1.default)('rex');
exports.etag = createETagGenerator({ weak: false });
exports.wetag = createETagGenerator({ weak: true });
const isAbsolute = function (path) {
    if ('/' === path[0])
        return true;
    if (':' === path[1] && ('\\' === path[2] || '/' === path[2]))
        return true; // Windows device path
    if ('\\\\' === path.substring(0, 2))
        return true; // Microsoft Azure absolute path 
};
exports.isAbsolute = isAbsolute;
exports.flatten = deprecate.function(arrayFlatten.flatten, 'utils.flatten: use array-flatten npm module instead');
const normalizeType = function (type) {
    return ~type.indexOf('/')
        ? acceptParams(type)
        : { value: mime.lookup(type), params: {} };
};
exports.normalizeType = normalizeType;
const normalizeTypes = function (types) {
    var ret = [];
    for (var i = 0; i < types.length; ++i) {
        ret.push(exports.normalizeType(types[i]));
    }
    return ret;
};
exports.normalizeTypes = normalizeTypes;
exports.contentDisposition = deprecate.function(content_disposition_1.default, 'utils.contentDisposition: use content-disposition npm module instead');
const compileETag = function (val) {
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
exports.compileETag = compileETag;
const compileQueryParser = function (val) {
    var fn;
    if (typeof val === 'function') {
        return val;
    }
    switch (val) {
        case true:
        case 'simple':
            fn = querystring_1.default.parse;
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
exports.compileQueryParser = compileQueryParser;
const compileTrust = function (val) {
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
    return proxy_addr_1.default.compile(val || []);
};
exports.compileTrust = compileTrust;
const setCharset = function (type, charset) {
    if (!type || !charset) {
        return type;
    }
    // parse type
    var parsed = content_type_1.default.parse(type);
    // set charset
    parsed.parameters.charset = charset;
    // format type
    return content_type_1.default.format(parsed);
};
exports.setCharset = setCharset;
function createETagGenerator(options) {
    return function generateETag(body, encoding) {
        var buf = !Buffer.isBuffer(body)
            ? Buffer.from(body, encoding)
            : body;
        return (0, exports.etag)(buf, options);
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
    return qs_1.default.parse(str, {
        allowPrototypes: true
    });
}
