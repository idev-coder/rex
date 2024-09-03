"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proto = void 0;
const setprototypeof_1 = __importDefault(require("setprototypeof"));
const depd_1 = __importDefault(require("depd"));
const debug_1 = __importDefault(require("debug"));
const array_flatten_1 = require("array-flatten");
const layer_1 = require("./layer");
const parseurl_1 = __importDefault(require("parseurl"));
const merge_descriptors_1 = __importDefault(require("merge-descriptors"));
const route_1 = __importDefault(require("./route"));
const deprecate = (0, depd_1.default)('rex');
const log = (0, debug_1.default)('rex:router');
const slice = Array.prototype.slice;
const objectRegExp = /^\[object (\S+)\]$/;
const toString = Object.prototype.toString;
const proto = function (options) {
    var opts = options || {};
    const router = function (req, res, next) {
        router.handle(req, res, next);
    };
    // mixin Router class functions
    (0, setprototypeof_1.default)(router, exports.proto);
    router.params = {};
    router._params = [];
    router.caseSensitive = opts.caseSensitive;
    router.mergeParams = opts.mergeParams;
    router.strict = opts.strict;
    router.stack = [];
    return router;
};
exports.proto = proto;
exports.proto.param = function (name, fn) {
    // param logic
    if (typeof name === 'function') {
        deprecate('router.param(fn): Refactor to use path params');
        this._params.push(name);
        return;
    }
    // apply param functions
    var params = this._params;
    var len = params.length;
    var ret;
    if (name[0] === ':') {
        deprecate('router.param(' + JSON.stringify(name) + ', fn): Use router.param(' + JSON.stringify(name.slice(1)) + ', fn) instead');
        name = name.slice(1);
    }
    for (var i = 0; i < len; ++i) {
        if (ret = params[i](name, fn)) {
            fn = ret;
        }
    }
    // ensure we end up with a
    // middleware function
    if ('function' !== typeof fn) {
        throw new Error('invalid param() call for ' + name + ', got ' + fn);
    }
    (this.params[name] = this.params[name] || []).push(fn);
    return this;
};
exports.proto.handle = function (req, res, out) {
    var self = this;
    log('dispatching %s %s', req.method, req.url);
    var idx = 0;
    var protohost = getProtohost(req.url) || '';
    var removed = '';
    var slashAdded = false;
    var sync = 0;
    var paramcalled = {};
    // store options for OPTIONS request
    // only used if OPTIONS request
    var options = [];
    // middleware and routes
    var stack = self.stack;
    // manage inter-router variables
    var parentParams = req.params;
    var parentUrl = req.baseUrl || '';
    var done = restore(out, req, 'baseUrl', 'next', 'params');
    // setup next layer
    req.next = next;
    // for options requests, respond with a default if nothing else responds
    if (req.method === 'OPTIONS') {
        done = wrap(done, function (old, err) {
            if (err || options.length === 0)
                return old(err);
            sendOptionsResponse(res, options, old);
        });
    }
    // setup basic req values
    req.baseUrl = parentUrl;
    req.originalUrl = req.originalUrl || req.url;
    next();
    function next(err) {
        var layerError = err === 'route'
            ? null
            : err;
        // remove added slash
        if (slashAdded) {
            req.url = req.url.slice(1);
            slashAdded = false;
        }
        // restore altered req.url
        if (removed.length !== 0) {
            req.baseUrl = parentUrl;
            req.url = protohost + removed + req.url.slice(protohost.length);
            removed = '';
        }
        // signal to exit router
        if (layerError === 'router') {
            setImmediate(done, null);
            return;
        }
        // no more matching layers
        if (idx >= stack.length) {
            setImmediate(done, layerError);
            return;
        }
        // max sync stack
        if (++sync > 100) {
            return setImmediate(next, err);
        }
        // get pathname of request
        var path = getPathname(req);
        if (path == null) {
            return done(layerError);
        }
        // find next matching layer
        var layer;
        var match;
        var route;
        while (match !== true && idx < stack.length) {
            layer = stack[idx++];
            match = matchLayer(layer, path);
            route = layer.route;
            if (typeof match !== 'boolean') {
                // hold on to layerError
                layerError = layerError || match;
            }
            if (match !== true) {
                continue;
            }
            if (!route) {
                // process non-route handlers normally
                continue;
            }
            if (layerError) {
                // routes do not match with a pending error
                match = false;
                continue;
            }
            var method = req.method;
            var has_method = route._handles_method(method);
            // build up automatic options response
            if (!has_method && method === 'OPTIONS') {
                appendMethods(options, route._options());
            }
            // don't even bother matching route
            if (!has_method && method !== 'HEAD') {
                match = false;
            }
        }
        // no match
        if (match !== true) {
            return done(layerError);
        }
        // store route for dispatch on change
        if (route) {
            req.route = route;
        }
        // Capture one-time layer values
        req.params = self.mergeParams
            ? mergeParams(layer.params, parentParams)
            : layer.params;
        var layerPath = layer.path;
        // this should be done for the layer
        self.process_params(layer, paramcalled, req, res, function (err) {
            if (err) {
                next(layerError || err);
            }
            else if (route) {
                layer.handle_request(req, res, next);
            }
            else {
                trim_prefix(layer, layerError, layerPath, path);
            }
            sync = 0;
        });
    }
    function trim_prefix(layer, layerError, layerPath, path) {
        if (layerPath.length !== 0) {
            // Validate path is a prefix match
            if (layerPath !== path.slice(0, layerPath.length)) {
                next(layerError);
                return;
            }
            // Validate path breaks on a path separator
            var c = path[layerPath.length];
            if (c && c !== '/' && c !== '.')
                return next(layerError);
            // Trim off the part of the url that matches the route
            // middleware (.use stuff) needs to have the path stripped
            log('trim prefix (%s) from url %s', layerPath, req.url);
            removed = layerPath;
            req.url = protohost + req.url.slice(protohost.length + removed.length);
            // Ensure leading slash
            if (!protohost && req.url[0] !== '/') {
                req.url = '/' + req.url;
                slashAdded = true;
            }
            // Setup base URL (no trailing slash)
            req.baseUrl = parentUrl + (removed[removed.length - 1] === '/'
                ? removed.substring(0, removed.length - 1)
                : removed);
        }
        log('%s %s : %s', layer.name, layerPath, req.originalUrl);
        if (layerError) {
            layer.handle_error(layerError, req, res, next);
        }
        else {
            layer.handle_request(req, res, next);
        }
    }
};
exports.proto.process_params = function (layer, called, req, res, done) {
    var params = this.params;
    // captured parameters from the layer, keys and values
    var keys = layer.keys;
    // fast track
    if (!keys || keys.length === 0) {
        return done();
    }
    var i = 0;
    var name;
    var paramIndex = 0;
    var key;
    var paramVal;
    var paramCallbacks;
    var paramCalled;
    // process params in order
    // param callbacks can be async
    function param(err) {
        if (err) {
            return done(err);
        }
        if (i >= keys.length) {
            return done();
        }
        paramIndex = 0;
        key = keys[i++];
        name = key.name;
        paramVal = req.params[name];
        paramCallbacks = params[name];
        paramCalled = called[name];
        if (paramVal === undefined || !paramCallbacks) {
            return param();
        }
        // param previously called with same value or error occurred
        if (paramCalled && (paramCalled.match === paramVal
            || (paramCalled.error && paramCalled.error !== 'route'))) {
            // restore value
            req.params[name] = paramCalled.value;
            // next param
            return param(paramCalled.error);
        }
        called[name] = paramCalled = {
            error: null,
            match: paramVal,
            value: paramVal
        };
        paramCallback();
    }
    // single param callbacks
    function paramCallback(err) {
        var fn = paramCallbacks[paramIndex++];
        // store updated value
        paramCalled.value = req.params[key.name];
        if (err) {
            // store error
            paramCalled.error = err;
            param(err);
            return;
        }
        if (!fn)
            return param();
        try {
            fn(req, res, paramCallback, paramVal, key.name);
        }
        catch (e) {
            paramCallback(e);
        }
    }
    param();
};
exports.proto.use = function (fn, ...args) {
    var offset = 0;
    var path = '/';
    // default path to '/'
    // disambiguate router.use([fn])
    if (typeof fn !== 'function') {
        var arg = fn;
        while (Array.isArray(arg) && arg.length !== 0) {
            arg = arg[0];
        }
        // first arg is the path
        if (typeof arg !== 'function') {
            offset = 1;
            path = fn;
        }
    }
    var callbacks = (0, array_flatten_1.flatten)(slice.call(args, offset));
    if (callbacks.length === 0) {
        throw new TypeError('Router.use() requires a middleware function');
    }
    for (var i = 0; i < callbacks.length; i++) {
        var fn = callbacks[i];
        if (typeof fn !== 'function') {
            throw new TypeError('Router.use() requires a middleware function but got a ' + gettype(fn));
        }
        // add the middleware
        log('use %o %s', path, fn.name || '<anonymous>');
        var layer = new layer_1.Layer(path, {
            sensitive: this.caseSensitive,
            strict: false,
            end: false
        }, fn);
        layer.route = undefined;
        this.stack.push(layer);
    }
    return this;
};
exports.proto.route = function (path) {
    var route = new route_1.default(path);
    var layer = new layer_1.Layer(path, {
        sensitive: this.caseSensitive,
        strict: this.strict,
        end: true
    }, route.dispatch.bind(route));
    layer.route = route;
    this.stack.push(layer);
    return route;
};
function getProtohost(url) {
    if (typeof url !== 'string' || url.length === 0 || url[0] === '/') {
        return undefined;
    }
    var searchIndex = url.indexOf('?');
    var pathLength = searchIndex !== -1
        ? searchIndex
        : url.length;
    var fqdnIndex = url.slice(0, pathLength).indexOf('://');
    return fqdnIndex !== -1
        ? url.substring(0, url.indexOf('/', 3 + fqdnIndex))
        : undefined;
}
function gettype(obj) {
    var type = typeof obj;
    if (type !== 'object') {
        return type;
    }
    // inspect [[Class]] for objects
    return toString.call(obj)
        .replace(objectRegExp, '$1');
}
function restore(fn, obj, ...args) {
    var props = new Array(args.length - 2);
    var vals = new Array(args.length - 2);
    for (var i = 0; i < props.length; i++) {
        props[i] = args[i + 2];
        vals[i] = obj[props[i]];
    }
    return function () {
        // restore vals
        for (var i = 0; i < props.length; i++) {
            obj[props[i]] = vals[i];
        }
        return fn.apply(this, args);
    };
}
function wrap(old, fn) {
    return function proxy() {
        var args = new Array(arguments.length + 1);
        args[0] = old;
        for (var i = 0, len = arguments.length; i < len; i++) {
            args[i + 1] = arguments[i];
        }
        fn.apply(this, args);
    };
}
function sendOptionsResponse(res, options, next) {
    try {
        var body = options.join(',');
        res.set('Allow', body);
        res.send(body);
    }
    catch (err) {
        next(err);
    }
}
function getPathname(req) {
    try {
        return (0, parseurl_1.default)(req).pathname;
    }
    catch (err) {
        return undefined;
    }
}
function matchLayer(layer, path) {
    try {
        return layer.match(path);
    }
    catch (err) {
        return err;
    }
}
function appendMethods(list, addition) {
    for (var i = 0; i < addition.length; i++) {
        var method = addition[i];
        if (list.indexOf(method) === -1) {
            list.push(method);
        }
    }
}
function mergeParams(params, parent) {
    if (typeof parent !== 'object' || !parent) {
        return params;
    }
    // make copy of parent for base
    var obj = (0, merge_descriptors_1.default)({}, parent);
    // simple non-numeric merging
    if (!(0 in params) || !(0 in parent)) {
        return (0, merge_descriptors_1.default)(obj, params);
    }
    var i = 0;
    var o = 0;
    // determine numeric gaps
    while (i in params) {
        i++;
    }
    while (o in parent) {
        o++;
    }
    // offset numeric indices in params before merge
    for (i--; i >= 0; i--) {
        params[i + o] = params[i];
        // create holes for the merge when necessary
        if (i < o) {
            delete params[i];
        }
    }
    return (0, merge_descriptors_1.default)(obj, params);
}
exports.default = exports.proto;
