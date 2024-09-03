import finalhandler from 'finalhandler';
import Router from './router';
import methods from 'methods'
import * as middleware from "./middleware/init";
import query from "./middleware/query";
import debug from "debug";
import View from './view'
import * as http from 'http'
import { compileETag, compileQueryParser, compileTrust } from './utils'
import depd from 'depd'
import { flatten } from "array-flatten";
import merge from 'utils-merge'
import path from 'path'
import setPrototypeOf from "setprototypeof";

const log = debug('rex:application')
const deprecate = depd('rex')
const resolve = path.resolve

export const application: any = {}


const hasOwnProperty = Object.prototype.hasOwnProperty
const slice = Array.prototype.slice;
const trustProxyDefaultSymbol = '@@symbol:trust_proxy_default';

application.init = function () {
    this.cache = {};
    this.engines = {};
    this.settings = {};

    this.defaultConfiguration()
}

application.defaultConfiguration = function (): void {
    var env = process.env.NODE_ENV || 'development';

    // default settings
    this.enable('x-powered-by');
    this.set('etag', 'weak');
    this.set('env', env);
    this.set('query parser', 'extended');
    this.set('subdomain offset', 2);
    this.set('trust proxy', false);

    // trust proxy inherit back-compat
    Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
        configurable: true,
        value: true
    });

    log('booting in %s mode', env);

    this.on('mount', function onmount(parent:any) {
        // inherit trust proxy
        if (this.settings[trustProxyDefaultSymbol] === true
            && typeof parent.settings['trust proxy fn'] === 'function') {
            delete this.settings['trust proxy'];
            delete this.settings['trust proxy fn'];
        }

        // inherit protos
        setPrototypeOf(this.request, parent.request)
        setPrototypeOf(this.response, parent.response)
        setPrototypeOf(this.engines, parent.engines)
        setPrototypeOf(this.settings, parent.settings)
    });

    // setup locals
    this.locals = Object.create(null);

    // top-most app is mounted at /
    this.mountpath = '/';

    // default locals
    this.locals.settings = this.settings;

    this.set('view', View);
    this.set('views', resolve('views'));
    this.set('jsonp callback name', 'callback');

    if (env === 'production') {
        this.enable('view cache');
    }

    Object.defineProperty(this, 'router', {
        get: function () {
            throw new Error('\'app.router\' is deprecated!\nPlease see the 3.x to 4.x migration guide for details on how to update your app.');
        }
    });
}

application.lazyrouter = function (): void {
    if (!this._router) {
        this._router =  Router({
            caseSensitive: this.enabled('case sensitive routing'),
            strict: this.enabled('strict routing')
        });

        this._router.use(query(this.get('query parser fn')));
        this._router.use(middleware.init(this));
    }
};

application.handle = function (req: any, res: any, callback: any): void {
    var router = this._router;

    // final handler
    var done = callback || finalhandler(req, res, {
        env: this.get('env'),
        onerror: logerror.bind(this)
    });

    // no routes
    if (!router) {
        debug('no routes defined on app');
        done();
        return;
    }

    router.handle(req, res, done);
};

application.use = function (fn: any, ...args: any[]): typeof module.exports {
    var offset: number = 0;
    var path: string = '/';

    // default path to '/'
    // disambiguate app.use([fn])
    if (typeof fn !== 'function') {
        var arg: any = fn;

        while (Array.isArray(arg) && arg.length !== 0) {
            arg = arg[0];
        }

        // first arg is the path
        if (typeof arg !== 'function') {
            offset = 1;
            path = fn;
        }
    }

    var fns = flatten(slice.call(args, offset));

    if (fns.length === 0) {
        throw new TypeError('application.use() requires a middleware function')
    }

    // setup router
    this.lazyrouter();
    var router: any = this._router;

    fns.forEach(function (fn) {
        // non-rex app
        if (!fn || !fn.handle || !fn.set) {
            return router.use(path, fn);
        }

        log('.use app under %s', path);

        fn.mountpath = path;
        fn.parent = this;

        // restore .app property on req and res
        router.use(path, function mounted_app(req, res, next) {
            var orig = req.app;
            fn.handle(req, res, function (err) {
                setPrototypeOf(req, orig.request)
                setPrototypeOf(res, orig.response)
                next(err);
            });
        });

        // mounted an app
        fn.emit('mount', this);
    }, this);

    return this;
};

application.route = function (path: any): any {
    this.lazyrouter();
    return this._router.route(path);
};

application.engine = function (ext: string, fn: Function): typeof module.exports {
    if (typeof fn !== 'function') {
        throw new Error('callback function required');
    }

    // get file extension
    var extension = ext[0] !== '.'
        ? '.' + ext
        : ext;

    // store engine
    this.engines[extension] = fn;

    return this;
};

application.param = function (name: string | any[], fn: Function): typeof module.exports {
    this.lazyrouter();

    if (Array.isArray(name)) {
        for (var i = 0; i < name.length; i++) {
            this.param(name[i], fn);
        }

        return this;
    }

    this._router.param(name, fn);

    return this;
};

application.set = function (setting: string, val?: any, ...args: any[]): http.Server {
    if (args.length === 1) {
        // app.get(setting)
        var settings = this.settings

        while (settings && settings !== Object.prototype) {
            if (hasOwnProperty.call(settings, setting)) {
                return settings[setting]
            }

            settings = Object.getPrototypeOf(settings)
        }

        return undefined
    }

    log('set "%s" to %o', setting, val);

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

application.path = function (): string {
    return this.parent
        ? this.parent.path() + this.mountpath
        : '';
};

application.enabled = function (setting: string): boolean {
    return Boolean(this.set(setting));
};

application.disabled = function (setting: string): boolean {
    return !this.set(setting);
};

application.enable = function (setting: string): typeof module.exports {
    return this.set(setting, true);
};

application.disable = function (setting: string): typeof module.exports {
    return this.set(setting, false);
};

application.all = function (path: string, ...args: any[]): typeof module.exports {
    this.lazyrouter();

    var route = this._router.route(path);
    var newArgs = slice.call(args, 1);

    for (var i = 0; i < methods.length; i++) {
        route[methods[i]].apply(route, newArgs);
    }

    return this;
};

application.del = deprecate.function(application.delete, 'application.del: Use application.delete instead');

application.render = function (name: string, options: any | Function, callback: Function): any {
    var cache = this.cache;
    var done = callback;
    var engines = this.engines;
    var opts = options;
    var renderOptions: any = {};
    var view;

    // support callback function as second arg
    if (typeof options === 'function') {
        done = options;
        opts = {};
    }

    // merge app.locals
    merge(renderOptions, this.locals);

    // merge options._locals
    if (opts._locals) {
        merge(renderOptions, opts._locals);
    }

    // merge options
    merge(renderOptions, opts);

    // set .cache unless explicitly provided
    if (renderOptions.cache == null) {
        renderOptions.cache = this.enabled('view cache');
    }

    // primed cache
    if (renderOptions.cache) {
        view = cache[name];
    }

    // view
    if (!view) {
        var View = this.get('view');

        view = new View(name, {
            defaultEngine: this.get('view engine'),
            root: this.get('views'),
            engines: engines
        });

        if (!view.path) {
            var dirs = Array.isArray(view.root) && view.root.length > 1
                ? 'directories "' + view.root.slice(0, -1).join('", "') + '" or "' + view.root[view.root.length - 1] + '"'
                : 'directory "' + view.root + '"'
            var err: any = new Error('Failed to lookup view "' + name + '" in views ' + dirs);
            err.view = view;
            return done(err);
        }

        // prime the cache
        if (renderOptions.cache) {
            cache[name] = view;
        }
    }

    // render
    tryRender(view, renderOptions, done);
};

application.listen = function (...args: any[]): http.Server {
    var server = http.createServer(this);
    return server.listen.apply(server, args);
};

methods.forEach(function (method: any): void {
    application[method] = function (path) {
        if (method === 'get' && arguments.length === 1) {
            // app.get(setting)
            return this.set(path);
        }

        this.lazyrouter();

        var route = this._router.route(path);
        route[method].apply(route, slice.call(arguments, 1));
        return this;
    };
});



function logerror(err: Error): void {
    /* istanbul ignore next */
    if (this.get('env') !== 'test') console.error(err.stack || err.toString());
}

function tryRender(view: any, options: any, callback: any): void {
    try {
        view.render(options, callback);
    } catch (err) {
        callback(err);
    }
}



export default application;