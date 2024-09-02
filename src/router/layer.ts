import debug from "debug";
import pathRegexp from 'path-to-regexp'

const log = debug('rex:application')
const hasOwnProperty = Object.prototype.hasOwnProperty;

export const Layer = function (path: string, options: any, fn: any): void {
    if (!(this instanceof Layer)) {
        return new Layer(path, options, fn);
    }

    log('new %o', path)
    var opts = options || {};

    this.handle = fn;
    this.name = fn.name || '<anonymous>';
    this.params = undefined;
    this.path = undefined;
    this.regexp = pathRegexp(path, this.keys = [], opts);

    // set fast path flags
    this.regexp.fast_star = path === '*'
    this.regexp.fast_slash = path === '/' && opts.end === false
}

Layer.prototype.handle_error = function (error: Error, req: Request, res: Response, next: Function): any {
    var fn = this.handle;

    if (fn.length !== 4) {
        // not a standard error handler
        return next(error);
    }

    try {
        fn(error, req, res, next);
    } catch (err) {
        next(err);
    }
};

Layer.prototype.handle_request = function (req: Request, res: Response, next: Function): any {
    var fn = this.handle;

    if (fn.length > 3) {
        // not a standard request handler
        return next();
    }

    try {
        fn(req, res, next);
    } catch (err) {
        next(err);
    }
};

Layer.prototype.match = function (path: string): boolean {
    var match

    if (path != null) {
        // fast path non-ending match for / (any path matches)
        if (this.regexp.fast_slash) {
            this.params = {}
            this.path = ''
            return true
        }

        // fast path for * (everything matched in a param)
        if (this.regexp.fast_star) {
            this.params = { '0': decode_param(path) }
            this.path = path
            return true
        }

        // match the path
        match = this.regexp.exec(path)
    }

    if (!match) {
        this.params = undefined;
        this.path = undefined;
        return false;
    }

    // store values
    this.params = {};
    this.path = match[0]

    var keys = this.keys;
    var params = this.params;

    for (var i = 1; i < match.length; i++) {
        var key = keys[i - 1];
        var prop = key.name;
        var val = decode_param(match[i])

        if (val !== undefined || !(hasOwnProperty.call(params, prop))) {
            params[prop] = val;
        }
    }

    return true;
};

function decode_param(val:string):string {
    if (typeof val !== 'string' || val.length === 0) {
        return val;
    }

    try {
        return decodeURIComponent(val);
    } catch (err:any) {
        if (err instanceof URIError) {
            (err as any).message = 'Failed to decode param \'' + val + '\'';
            (err as any).status = (err as any).statusCode = 400;
        }

        throw err;
    }
}


export default Layer
