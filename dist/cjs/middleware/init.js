"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const setprototypeof_1 = __importDefault(require("setprototypeof"));
const init = function (app) {
    return function (req, res, next) {
        if (app.enabled('x-powered-by'))
            res.setHeader('X-Powered-By', 'Rex');
        req.res = res;
        res.req = req;
        req.next = next;
        (0, setprototypeof_1.default)(req, app.request);
        (0, setprototypeof_1.default)(res, app.response);
        res.locals = res.locals || Object.create(null);
        next();
    };
};
exports.init = init;
