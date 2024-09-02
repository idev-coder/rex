"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const utils_merge_1 = __importDefault(require("utils-merge"));
const qs_1 = __importDefault(require("qs"));
const parseurl_1 = __importDefault(require("parseurl"));
function default_1(options) {
    var opts = (0, utils_merge_1.default)({}, options);
    var queryparse = qs_1.default.parse;
    if (typeof options === 'function') {
        queryparse = options;
        opts = undefined;
    }
    if (opts !== undefined && opts.allowPrototypes === undefined) {
        // back-compat for qs module
        opts.allowPrototypes = true;
    }
    return function query(req, res, next) {
        if (!req.query) {
            var val = (0, parseurl_1.default)(req).query;
            req.query = queryparse(val, opts);
        }
        next();
    };
}
