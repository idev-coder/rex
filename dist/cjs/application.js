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
exports.application = void 0;
const finalhandler_1 = __importDefault(require("finalhandler"));
const router_1 = __importDefault(require("./router"));
const methods_1 = __importDefault(require("methods"));
const middleware = __importStar(require("./middleware/init"));
const query_1 = __importDefault(require("./middleware/query"));
const debug_1 = __importDefault(require("debug"));
const view_1 = __importDefault(require("./view"));
const http = __importStar(require("http"));
const utils_1 = require("./utils");
const depd_1 = __importDefault(require("depd"));
const array_flatten_1 = require("array-flatten");
const utils_merge_1 = __importDefault(require("utils-merge"));
const path_1 = __importDefault(require("path"));
const setprototypeof_1 = __importDefault(require("setprototypeof"));
const log = (0, debug_1.default)('rex:application');
const deprecate = (0, depd_1.default)('rex');
const resolve = path_1.default.resolve;
exports.application = {};
const hasOwnProperty = Object.prototype.hasOwnProperty;
const slice = Array.prototype.slice;
const trustProxyDefaultSymbol = '@@symbol:trust_proxy_default';
exports.application.init = function () {
    this.cache = {};
    this.engines = {};
    this.settings = {};
    this.defaultConfiguration();
};
exports.application.defaultConfiguration = function () {
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
    this.on('mount', function onmount(parent) {
        // inherit trust proxy
        if (this.settings[trustProxyDefaultSymbol] === true
            && typeof parent.settings['trust proxy fn'] === 'function') {
            delete this.settings['trust proxy'];
            delete this.settings['trust proxy fn'];
        }
        // inherit protos
        (0, setprototypeof_1.default)(this.request, parent.request);
        (0, setprototypeof_1.default)(this.response, parent.response);
        (0, setprototypeof_1.default)(this.engines, parent.engines);
        (0, setprototypeof_1.default)(this.settings, parent.settings);
    });
    // setup locals
    this.locals = Object.create(null);
    // top-most app is mounted at /
    this.mountpath = '/';
    // default locals
    this.locals.settings = this.settings;
    this.set('view', view_1.default);
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
};
exports.application.lazyrouter = function () {
    if (!this._router) {
        this._router = (0, router_1.default)({
            caseSensitive: this.enabled('case sensitive routing'),
            strict: this.enabled('strict routing')
        });
        this._router.use((0, query_1.default)(this.get('query parser fn')));
        this._router.use(middleware.init(this));
    }
};
exports.application.handle = function (req, res, callback) {
    var router = this._router;
    // final handler
    var done = callback || (0, finalhandler_1.default)(req, res, {
        env: this.get('env'),
        onerror: logerror.bind(this)
    });
    // no routes
    if (!router) {
        (0, debug_1.default)('no routes defined on app');
        done();
        return;
    }
    router.handle(req, res, done);
};
exports.application.use = function (fn, ...args) {
    var offset = 0;
    var path = '/';
    // default path to '/'
    // disambiguate app.use([fn])
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
    var fns = (0, array_flatten_1.flatten)(slice.call(args, offset));
    if (fns.length === 0) {
        throw new TypeError('application.use() requires a middleware function');
    }
    // setup router
    this.lazyrouter();
    var router = this._router;
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
                (0, setprototypeof_1.default)(req, orig.request);
                (0, setprototypeof_1.default)(res, orig.response);
                next(err);
            });
        });
        // mounted an app
        fn.emit('mount', this);
    }, this);
    return this;
};
exports.application.route = function (path) {
    this.lazyrouter();
    return this._router.route(path);
};
exports.application.engine = function (ext, fn) {
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
exports.application.param = function (name, fn) {
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
exports.application.set = function (setting, val, ...args) {
    if (args.length === 1) {
        // app.get(setting)
        var settings = this.settings;
        while (settings && settings !== Object.prototype) {
            if (hasOwnProperty.call(settings, setting)) {
                return settings[setting];
            }
            settings = Object.getPrototypeOf(settings);
        }
        return undefined;
    }
    log('set "%s" to %o', setting, val);
    // set value
    this.settings[setting] = val;
    // trigger matched settings
    switch (setting) {
        case 'etag':
            this.set('etag fn', (0, utils_1.compileETag)(val));
            break;
        case 'query parser':
            this.set('query parser fn', (0, utils_1.compileQueryParser)(val));
            break;
        case 'trust proxy':
            this.set('trust proxy fn', (0, utils_1.compileTrust)(val));
            // trust proxy inherit back-compat
            Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
                configurable: true,
                value: false
            });
            break;
    }
    return this;
};
exports.application.path = function () {
    return this.parent
        ? this.parent.path() + this.mountpath
        : '';
};
exports.application.enabled = function (setting) {
    return Boolean(this.set(setting));
};
exports.application.disabled = function (setting) {
    return !this.set(setting);
};
exports.application.enable = function (setting) {
    return this.set(setting, true);
};
exports.application.disable = function (setting) {
    return this.set(setting, false);
};
exports.application.all = function (path, ...args) {
    this.lazyrouter();
    var route = this._router.route(path);
    var newArgs = slice.call(args, 1);
    for (var i = 0; i < methods_1.default.length; i++) {
        route[methods_1.default[i]].apply(route, newArgs);
    }
    return this;
};
exports.application.del = deprecate.function(exports.application.delete, 'application.del: Use application.delete instead');
exports.application.render = function (name, options, callback) {
    var cache = this.cache;
    var done = callback;
    var engines = this.engines;
    var opts = options;
    var renderOptions = {};
    var view;
    // support callback function as second arg
    if (typeof options === 'function') {
        done = options;
        opts = {};
    }
    // merge app.locals
    (0, utils_merge_1.default)(renderOptions, this.locals);
    // merge options._locals
    if (opts._locals) {
        (0, utils_merge_1.default)(renderOptions, opts._locals);
    }
    // merge options
    (0, utils_merge_1.default)(renderOptions, opts);
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
                : 'directory "' + view.root + '"';
            var err = new Error('Failed to lookup view "' + name + '" in views ' + dirs);
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
exports.application.listen = function (...args) {
    var server = http.createServer(this);
    return server.listen.apply(server, args);
};
methods_1.default.forEach(function (method) {
    exports.application[method] = function (path) {
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
function logerror(err) {
    /* istanbul ignore next */
    if (this.get('env') !== 'test')
        console.error(err.stack || err.toString());
}
function tryRender(view, options, callback) {
    try {
        view.render(options, callback);
    }
    catch (err) {
        callback(err);
    }
}
exports.default = exports.application;
