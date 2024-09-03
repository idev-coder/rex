"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.react = void 0;
const react_1 = __importDefault(require("react"));
const server_1 = __importDefault(require("react-dom/server"));
const js_beautify_1 = __importDefault(require("js-beautify"));
const object_assign_1 = __importDefault(require("object-assign"));
const lodash_escaperegexp_1 = __importDefault(require("lodash.escaperegexp"));
const react = function () {
    const engine = function (engineOptions) {
        const DEFAULT_OPTIONS = {
            doctype: '<!DOCTYPE html>',
            beautify: false,
            transformViews: true,
            babel: {
                "presets": [
                    "@babel/preset-env",
                    [
                        "@babel/preset-react",
                        {
                            "runtime": "automatic"
                        }
                    ],
                    "@babel/preset-typescript"
                ]
            },
        };
        var registered = false;
        var moduleDetectRegEx;
        engineOptions = (0, object_assign_1.default)({}, DEFAULT_OPTIONS, engineOptions || {});
        function renderFile(filename, options, cb) {
            // Defer babel registration until the first request so we can grab the view path.
            if (!moduleDetectRegEx) {
                // Path could contain regexp characters so escape it first.
                // options.settings.views could be a single string or an array
                moduleDetectRegEx = new RegExp([]
                    .concat(options.settings.views)
                    .map(viewPath => '^' + (0, lodash_escaperegexp_1.default)(viewPath))
                    .join('|'));
            }
            if (engineOptions.transformViews && !registered) {
                // Passing a RegExp to Babel results in an issue on Windows so we'll just
                // pass the view path.
                require('@babel/register')((0, object_assign_1.default)({ only: [].concat(options.settings.views) }, engineOptions.babel));
                registered = true;
            }
            try {
                var markup = engineOptions.doctype;
                var component = require(filename);
                // Transpiled ES6 may export components as { default: Component }
                component = component.default || component;
                markup += server_1.default.renderToStaticMarkup(react_1.default.createElement(component, options));
            }
            catch (e) {
                return cb(e);
            }
            finally {
                if (options.settings.env === 'development') {
                    // Remove all files from the module cache that are in the view folder.
                    Object.keys(require.cache).forEach(function (module) {
                        if (moduleDetectRegEx.test(require.cache[module].filename)) {
                            delete require.cache[module];
                        }
                    });
                }
            }
            if (engineOptions.beautify) {
                // NOTE: This will screw up some things where whitespace is important, and be
                // subtly different than prod.
                markup = (0, js_beautify_1.default)(markup);
            }
            cb(null, markup);
        }
        return renderFile;
    };
    return engine;
};
exports.react = react;
exports.default = exports.react;
