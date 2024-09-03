import bodyParser from 'body-parser';
import { EventEmitter } from 'events';
import mixin from 'merge-descriptors';
import application from './application';
import Route from './router/route';
import Router from './router';
import request from './request';
import response from './response';
import query from './middleware/query';
import serveStatic from 'serve-static';
export const rex = function () {
    const app = function (req, res, next) {
        app.handle(req, res, next);
    };
    mixin(app, EventEmitter.prototype, false);
    mixin(app, application, false);
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
};
rex.application = application;
rex.Route = Route;
rex.Router = Router;
rex.json = bodyParser.json;
rex.query = query;
rex.raw = bodyParser.raw;
rex.static = serveStatic;
rex.text = bodyParser.text;
rex.urlencoded = bodyParser.urlencoded;
var removedMiddlewares = [
    'bodyParser',
    'compress',
    'cookieSession',
    'session',
    'logger',
    'cookieParser',
    'favicon',
    'responseTime',
    'errorHandler',
    'timeout',
    'methodOverride',
    'vhost',
    'csrf',
    'directory',
    'limit',
    'multipart',
    'staticCache'
];
removedMiddlewares.forEach(function (name) {
    Object.defineProperty(rex, name, {
        get: function () {
            throw new Error('Most middleware (like ' + name + ') is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.');
        },
        configurable: true
    });
});
export default rex;
