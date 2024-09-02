"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.application = void 0;
exports.createApplication = createApplication;
const events_1 = require("events");
const merge_descriptors_1 = __importDefault(require("merge-descriptors"));
const application_1 = __importDefault(require("./application"));
const request_1 = __importDefault(require("./request"));
const response_1 = __importDefault(require("./response"));
function createApplication() {
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
}
exports.application = application_1.default;
exports.default = createApplication;
