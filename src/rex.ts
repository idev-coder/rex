import bodyParser from 'body-parser'
import { EventEmitter } from 'events'
import mixin from 'merge-descriptors'
import proto from './application'
import Route from './router/route'
import Router from './router'
import request from './request'
import response from './response'


export function createApplication(): Function {
    const app: {
        (req: any, res: any, next: any): void;
        request: any;
        response: any;
        handle?: { (req: any, res: any, next: any): void };
        init?: { (): void }

    } = function (req: any, res: any, next: any): void {
        app.handle(req, res, next);
    };

    mixin(app, EventEmitter.prototype, false);
    mixin(app, proto, false);

    // expose the prototype that will get set on requests
    app.request = Object.create(request, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    })

    // expose the prototype that will get set on responses
    app.response = Object.create(response, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    })

    app.init();
    return app;

}

export const application = proto;

export default createApplication