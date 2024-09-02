import debug from "debug";
import { flatten } from "array-flatten";
import { Layer } from "./layer";
import methods from 'methods'

const log = debug('rex:application')

const slice = Array.prototype.slice;
const toString = Object.prototype.toString;

export const Route = function (path: string): void {
    this.path = path;
    this.stack = [];

    log('new %o', path)

    // route handlers for various http methods
    this.methods = {};
}

Route.prototype._handles_method = function (method: any): boolean {
    if (this.methods._all) {
        return true;
    }

    // normalize name
    var name = typeof method === 'string'
        ? method.toLowerCase()
        : method

    if (name === 'head' && !this.methods['head']) {
        name = 'get';
    }

    return Boolean(this.methods[name]);
};

Route.prototype._options = function (): any[] {
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

Route.prototype.dispatch = function (req: any, res: any, done: any): any {
    var idx = 0;
    var stack = this.stack;
    var sync = 0

    if (stack.length === 0) {
        return done();
    }
    var method = typeof req.method === 'string'
        ? req.method.toLowerCase()
        : req.method

    if (method === 'head' && !this.methods['head']) {
        method = 'get';
    }

    req.route = this;

    next();

    function next(err?: any) {
        // signal to exit route
        if (err && err === 'route') {
            return done();
        }

        // signal to exit router
        if (err && err === 'router') {
            return done(err)
        }

        // max sync stack
        if (++sync > 100) {
            return setImmediate(next, err)
        }

        var layer = stack[idx++]

        // end of layers
        if (!layer) {
            return done(err)
        }

        if (layer.method && layer.method !== method) {
            next(err)
        } else if (err) {
            layer.handle_error(err, req, res, next);
        } else {
            layer.handle_request(req, res, next);
        }

        sync = 0
    }
};

Route.prototype.all = function (...args: any[]) {
    var handles = flatten(slice.call(args));

    for (var i = 0; i < handles.length; i++) {
        var handle = handles[i];

        if (typeof handle !== 'function') {
            var type = toString.call(handle);
            var msg = 'Route.all() requires a callback function but got a ' + type
            throw new TypeError(msg);
        }

        var layer:any = Layer('/', {}, handle);
        layer.method = undefined;

        this.methods._all = true;
        this.stack.push(layer);
    }

    return this;
};

methods.forEach(function (method: any): void {
    Route.prototype[method] = function () {
        var handles = flatten(slice.call(arguments));

        for (var i = 0; i < handles.length; i++) {
            var handle = handles[i];

            if (typeof handle !== 'function') {
                var type = toString.call(handle);
                var msg = 'Route.' + method + '() requires a callback function but got a ' + type
                throw new Error(msg);
            }

            log('%s %o', method, this.path)

            var layer: any = Layer('/', {}, handle);
            layer.method = method;

            this.methods[method] = true;
            this.stack.push(layer);
        }

        return this;
    };
});

export default Route