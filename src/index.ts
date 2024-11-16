import mixin from 'merge-descriptors'
import proto from './application'
import req from './request'
import res from './response'
import EventEmitter from 'events'

export { json, raw, static, text, urlencoded, Router } from 'express'

export const application = proto
export const request = req
export const response = res

export function createApplication(): Function {
    var app: any = function (req: any, res: any, next: any): void {
        app.handle(req, res, next);
    };

    mixin(app, EventEmitter.prototype, false);
    mixin(app, proto, false);

    // expose the prototype that will get set on requests
    app.request = Object.create(req, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    })

    // expose the prototype that will get set on responses
    app.response = Object.create(res, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    })

    app.init();
    return app;
}