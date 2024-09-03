"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rex = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const events_1 = require("events");
const merge_descriptors_1 = __importDefault(require("merge-descriptors"));
const application_1 = __importDefault(require("./application"));
const route_1 = __importDefault(require("./router/route"));
const router_1 = __importDefault(require("./router"));
const request_1 = __importDefault(require("./request"));
const response_1 = __importDefault(require("./response"));
const query_1 = __importDefault(require("./middleware/query"));
const serve_static_1 = __importDefault(require("serve-static"));
const rex = function () {
    const app = function (req, res, next) {
        app.handle(req, res, next);
    };
    (0, merge_descriptors_1.default)(app, events_1.EventEmitter.prototype, false);
    (0, merge_descriptors_1.default)(app, application_1.default, false);
    // expose the prototype that will get set on requests
    app.request = Object.create(request_1.default, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    });
    // expose the prototype that will get set on responses
    app.response = Object.create(response_1.default, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    });
    app.init();
    return app;
};
exports.rex = rex;
exports.rex.application = application_1.default;
exports.rex.Route = route_1.default;
exports.rex.Router = router_1.default;
exports.rex.json = body_parser_1.default.json;
exports.rex.query = query_1.default;
exports.rex.raw = body_parser_1.default.raw;
exports.rex.static = serve_static_1.default;
exports.rex.text = body_parser_1.default.text;
exports.rex.urlencoded = body_parser_1.default.urlencoded;
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
    Object.defineProperty(exports.rex, name, {
        get: function () {
            throw new Error('Most middleware (like ' + name + ') is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.');
        },
        configurable: true
    });
});
exports.default = exports.rex;
