import setPrototypeOf from "setprototypeof";

export const init = function (app?: any): Function {
    return function (req: any, res: any, next: any): void {
        if (app.enabled('x-powered-by')) res.setHeader('X-Powered-By', 'Rex');

        req.res = res;
        res.req = req;
        req.next = next;

        setPrototypeOf(req, app.request)
        setPrototypeOf(res, app.response)

        res.locals = res.locals || Object.create(null);

        next();
    }
}