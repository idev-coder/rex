import React from 'react'
import ReactDOMServer from 'react-dom/server'
import beautifyHTML from 'js-beautify'
import assign from 'object-assign'
import _escaperegexp from 'lodash.escaperegexp'

export const react = function () {
    const engine: {
        (engineOptions?: any): { (filename: any, options: any, cb: any): any }
    } = function (engineOptions) {
        const DEFAULT_OPTIONS: any = {
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
        }

        var registered = false;
        var moduleDetectRegEx;

        engineOptions = assign({}, DEFAULT_OPTIONS, engineOptions || {});

        function renderFile(filename: any, options: any, cb: any): any {
            // Defer babel registration until the first request so we can grab the view path.
            if (!moduleDetectRegEx) {
                // Path could contain regexp characters so escape it first.
                // options.settings.views could be a single string or an array
                moduleDetectRegEx = new RegExp(
                    []
                        .concat(options.settings.views)
                        .map(viewPath => '^' + _escaperegexp(viewPath))
                        .join('|')
                );
            }

            if (engineOptions.transformViews && !registered) {
                // Passing a RegExp to Babel results in an issue on Windows so we'll just
                // pass the view path.
                require('@babel/register')(
                    assign({ only: [].concat(options.settings.views) }, engineOptions.babel)
                );
                registered = true;
            }

            try {
                var markup = engineOptions.doctype;
                var component = require(filename);
                // Transpiled ES6 may export components as { default: Component }
                component = component.default || component;
                markup += ReactDOMServer.renderToStaticMarkup(
                    React.createElement(component, options)
                );
            } catch (e) {
                return cb(e);
            } finally {
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
                markup = beautifyHTML(markup);
            }

            cb(null, markup);
        }

        return renderFile;

    }

    return engine
}

export default react