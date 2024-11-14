import { Router } from "./router";
import finalhandler from 'finalhandler'
import { compileETag, compileQueryParser, compileTrust } from "./utils";
import methods from 'methods'
import http from 'http'
import once from 'once'
import { IApplication } from "./types/application";

var debug = require('debug')('rex:application');
var slice = Array.prototype.slice;
var flatten = Array.prototype.flat;

var app: IApplication = Object.create({})

var trustProxyDefaultSymbol = '@@symbol:trust_proxy_default';

app.init = function init() {
    var router: any = null;

    this.cache = Object.create(null);
    this.engines = Object.create(null);
    this.settings = Object.create(null);

    this.defaultConfiguration();

    // Setup getting to lazily add base router
    Object.defineProperty(this, 'router', {
        configurable: true,
        enumerable: true,
        get: function getrouter() {
            if (router === null) {
                router = new Router({
                    caseSensitive: this.enabled('case sensitive routing'),
                    strict: this.enabled('strict routing')
                });
            }

            return router;
        }
    });
};

app.defaultConfiguration = function defaultConfiguration() {
    var env = process.env.NODE_ENV || 'development';

    // default settings
    this.enable('x-powered-by');
    this.set('etag', 'weak');
    this.set('env', env);
    this.set('query parser', 'simple')
    this.set('subdomain offset', 2);
    this.set('trust proxy', false);

    // trust proxy inherit back-compat
    Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
        configurable: true,
        value: true
    });

    debug('booting in %s mode', env);

    this.on('mount', (parent) => {
        // inherit trust proxy
        if (this.settings[trustProxyDefaultSymbol] === true
            && typeof parent.settings['trust proxy fn'] === 'function') {
            delete this.settings['trust proxy'];
            delete this.settings['trust proxy fn'];
        }

        // inherit protos
        Object.setPrototypeOf(this.request, parent.request)
        Object.setPrototypeOf(this.response, parent.response)
        Object.setPrototypeOf(this.engines, parent.engines)
        Object.setPrototypeOf(this.settings, parent.settings)
    });

    // setup locals
    this.locals = Object.create(null);

    // top-most app is mounted at /
    this.mountpath = '/';

    // default locals
    this.locals.settings = this.settings;

    // default configuration
    this.set('jsonp callback name', 'callback');

};

app.handle = function handle(req, res, callback) {
    // final handler
    var done = callback || finalhandler(req, res, {
        env: this.get('env'),
        onerror: logerror.bind(this)
    });

    // set powered by header
    if (this.enabled('x-powered-by')) {
        res.setHeader('X-Powered-By', 'Express');
    }

    // set circular references
    req.res = res;
    res.req = req;

    // alter the prototypes
    Object.setPrototypeOf(req, this.request)
    Object.setPrototypeOf(res, this.response)

    // setup locals
    if (!res.locals) {
        res.locals = Object.create(null);
    }

    this.router.handle(req, res, done);
};

app.route = function route(path) {
    return this.router.route(path);
};

app.param = function param(name, fn) {
    if (Array.isArray(name)) {
        for (var i = 0; i < name.length; i++) {
            this.param(name[i], fn);
        }

        return this;
    }

    this.router.param(name, fn);

    return this;
};

app.set = function set(setting, val) {
    if (arguments.length === 1) {
        return this.settings[setting];
    }

    debug('set "%s" to %o', setting, val);

    // set value
    this.settings[setting] = val;

    // trigger matched settings
    switch (setting) {
        case 'etag':
            this.set('etag fn', compileETag(val));
            break;
        case 'query parser':
            this.set('query parser fn', compileQueryParser(val));
            break;
        case 'trust proxy':
            this.set('trust proxy fn', compileTrust(val));

            // trust proxy inherit back-compat
            Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
                configurable: true,
                value: false
            });

            break;
    }

    return this;
};

app.path = function path() {
    return this.parent
        ? this.parent.path() + this.mountpath
        : '';
};

app.enabled = function enabled(setting) {
    return Boolean(this.set(setting));
};

app.disabled = function disabled(setting) {
    return !this.set(setting);
};

app.enable = function enable(setting) {
    return this.set(setting, true);
};

app.disable = function disable(setting) {
    return this.set(setting, false);
};

app.all = function all(path) {
    var route = this.route(path);
    var args = slice.call(arguments, 1);

    for (var i = 0; i < methods.length; i++) {
        route[methods[i]].apply(route, args);
    }

    return this;
};

app.listen = function listen(this: any, ...arg) {
    var server = http.createServer(this)
    var args: any = Array.prototype.slice.call(arg)
    if (typeof args[args.length - 1] === 'function') {
        var done = args[args.length - 1] = once(args[args.length - 1])
        server.once('error', done)
    }
    return server.listen.apply(server, args)
}

methods.forEach(function (method) {
    app[method] = function (path) {
        if (method === 'get' && arguments.length === 1) {
            return this.set(path);
        }

        var route = this.route(path);
        route[method].apply(route, slice.call(arguments, 1));
        return this;
    };
});


function logerror(this: any, err) {
    if (this.get('env') !== 'test') console.error(err.stack || err.toString());
}

export default app