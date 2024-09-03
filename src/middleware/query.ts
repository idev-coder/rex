import merge from "utils-merge";
import qs from 'qs'
import parseUrl from 'parseurl'

export default function (options?: any): Function {
    var opts:any = merge({}, options)
    var queryparse = qs.parse;

    if (typeof options === 'function') {
        queryparse = options;
        opts = undefined;
    }

    if (opts !== undefined && opts.allowPrototypes === undefined) {
        // back-compat for qs module
        opts.allowPrototypes = true;
    }

    return function query(req: any, res: any, next: any): void {
        if (!req.query) {
            var val = parseUrl(req).query;
            req.query = queryparse(val, opts);
        }

        next();
    };
}