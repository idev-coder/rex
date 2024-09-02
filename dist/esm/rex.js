import { EventEmitter } from 'events';
import mixin from 'merge-descriptors';
import proto from './application';
import request from './request';
import response from './response';
export function createApplication() {
    const app = function (req, res, next) {
        app.handle(req, res, next);
    };
    mixin(app, EventEmitter.prototype, false);
    mixin(app, proto, false);
    // expose the prototype that will get set on requests
    app.request = Object.create(request, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    });
    // expose the prototype that will get set on responses
    app.response = Object.create(response, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    });
    app.init();
    return app;
}
export const application = proto;
export default createApplication;
