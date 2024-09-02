"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
const debug_1 = __importDefault(require("debug"));
const array_flatten_1 = require("array-flatten");
const layer_1 = require("./layer");
const methods_1 = __importDefault(require("methods"));
const log = (0, debug_1.default)('rex:application');
const slice = Array.prototype.slice;
const toString = Object.prototype.toString;
const Route = function (path) {
    this.path = path;
    this.stack = [];
    log('new %o', path);
    // route handlers for various http methods
    this.methods = {};
};
exports.Route = Route;
exports.Route.prototype._handles_method = function (method) {
    if (this.methods._all) {
        return true;
    }
    // normalize name
    var name = typeof method === 'string'
        ? method.toLowerCase()
        : method;
    if (name === 'head' && !this.methods['head']) {
        name = 'get';
    }
    return Boolean(this.methods[name]);
};
exports.Route.prototype._options = function () {
    var methods = Object.keys(this.methods);
    // append automatic head
    if (this.methods.get && !this.methods.head) {
        methods.push('head');
    }
    for (var i = 0; i < methods.length; i++) {
        // make upper case
        methods[i] = methods[i].toUpperCase();
    }
    return methods;
};
exports.Route.prototype.dispatch = function (req, res, done) {
    var idx = 0;
    var stack = this.stack;
    var sync = 0;
    if (stack.length === 0) {
        return done();
    }
    var method = typeof req.method === 'string'
        ? req.method.toLowerCase()
        : req.method;
    if (method === 'head' && !this.methods['head']) {
        method = 'get';
    }
    req.route = this;
    next();
    function next(err) {
        // signal to exit route
        if (err && err === 'route') {
            return done();
        }
        // signal to exit router
        if (err && err === 'router') {
            return done(err);
        }
        // max sync stack
        if (++sync > 100) {
            return setImmediate(next, err);
        }
        var layer = stack[idx++];
        // end of layers
        if (!layer) {
            return done(err);
        }
        if (layer.method && layer.method !== method) {
            next(err);
        }
        else if (err) {
            layer.handle_error(err, req, res, next);
        }
        else {
            layer.handle_request(req, res, next);
        }
        sync = 0;
    }
};
exports.Route.prototype.all = function (...args) {
    var handles = (0, array_flatten_1.flatten)(slice.call(args));
    for (var i = 0; i < handles.length; i++) {
        var handle = handles[i];
        if (typeof handle !== 'function') {
            var type = toString.call(handle);
            var msg = 'Route.all() requires a callback function but got a ' + type;
            throw new TypeError(msg);
        }
        var layer = (0, layer_1.Layer)('/', {}, handle);
        layer.method = undefined;
        this.methods._all = true;
        this.stack.push(layer);
    }
    return this;
};
methods_1.default.forEach(function (method) {
    exports.Route.prototype[method] = function () {
        var handles = (0, array_flatten_1.flatten)(slice.call(arguments));
        for (var i = 0; i < handles.length; i++) {
            var handle = handles[i];
            if (typeof handle !== 'function') {
                var type = toString.call(handle);
                var msg = 'Route.' + method + '() requires a callback function but got a ' + type;
                throw new Error(msg);
            }
            log('%s %o', method, this.path);
            var layer = (0, layer_1.Layer)('/', {}, handle);
            layer.method = method;
            this.methods[method] = true;
            this.stack.push(layer);
        }
        return this;
    };
});
exports.default = exports.Route;
