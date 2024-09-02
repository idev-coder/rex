"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.View = void 0;
const debug_1 = __importDefault(require("debug"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const log = (0, debug_1.default)('rex:view');
const dirname = path_1.default.dirname;
const basename = path_1.default.basename;
const extname = path_1.default.extname;
const join = path_1.default.join;
const resolve = path_1.default.resolve;
const View = function (name, options) {
    var opts = options || {};
    this.defaultEngine = opts.defaultEngine;
    this.ext = extname(name);
    this.name = name;
    this.root = opts.root;
    if (!this.ext && !this.defaultEngine) {
        throw new Error('No default engine was specified and no extension was provided.');
    }
    var fileName = name;
    if (!this.ext) {
        // get extension from default engine name
        this.ext = this.defaultEngine[0] !== '.'
            ? '.' + this.defaultEngine
            : this.defaultEngine;
        fileName += this.ext;
    }
    if (!opts.engines[this.ext]) {
        // load engine
        var mod = this.ext.slice(1);
        log('require "%s"', mod);
        // default engine export
        var fn = require(mod).__express;
        if (typeof fn !== 'function') {
            throw new Error('Module "' + mod + '" does not provide a view engine.');
        }
        opts.engines[this.ext] = fn;
    }
    // store loaded engine
    this.engine = opts.engines[this.ext];
    // lookup path
    this.path = this.lookup(fileName);
};
exports.View = View;
exports.View.prototype.lookup = function (name) {
    var path;
    var roots = [].concat(this.root);
    log('lookup "%s"', name);
    for (var i = 0; i < roots.length && !path; i++) {
        var root = roots[i];
        // resolve the path
        var loc = resolve(root, name);
        var dir = dirname(loc);
        var file = basename(loc);
        // resolve the file
        path = this.resolve(dir, file);
    }
    return path;
};
exports.View.prototype.render = function (options, callback) {
    log('render "%s"', this.path);
    this.engine(this.path, options, callback);
};
exports.View.prototype.resolve = function (dir, file) {
    var ext = this.ext;
    // <path>.<ext>
    var path = join(dir, file);
    var stat = tryStat(path);
    if (stat && stat.isFile()) {
        return path;
    }
    // <path>/index.<ext>
    path = join(dir, basename(file, ext), 'index' + ext);
    stat = tryStat(path);
    if (stat && stat.isFile()) {
        return path;
    }
};
function tryStat(path) {
    log('stat "%s"', path);
    try {
        return fs_1.default.statSync(path);
    }
    catch (e) {
        return undefined;
    }
}
exports.default = exports.View;
