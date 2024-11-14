import { METHODS } from 'http'
import parseUrl from 'parseurl'
import mixin from 'utils-merge'
import { Layer } from './layer'
import { Route } from './route'
import isPromise from 'is-promise'

const slice = Array.prototype.slice
const flatten = Array.prototype.flat
const methods = METHODS.map((method) => method.toLowerCase())

export class Router {
    params: any
    stack: any
    caseSensitive: any
    strict: any
    constructor(options) {
        if (!(this instanceof Router)) {
            return new Router(options)
        }

        const opts = options || {}

        const router = (req, res, next) => {
            (router as any).handle(req, res, next)
        }

        // inherit from the correct prototype
        Object.setPrototypeOf(router, this)

        router.caseSensitive = opts.caseSensitive
        router.mergeParams = opts.mergeParams
        router.params = {}
        router.strict = opts.strict
        router.stack = []

    }

    param(name, fn) {
        if (!name) {
            throw new TypeError('argument name is required')
        }

        if (typeof name !== 'string') {
            throw new TypeError('argument name must be a string')
        }

        if (!fn) {
            throw new TypeError('argument fn is required')
        }

        if (typeof fn !== 'function') {
            throw new TypeError('argument fn must be a function')
        }

        let params = this.params[name]

        if (!params) {
            params = this.params[name] = []
        }

        params.push(fn)

        return this
    }

    handle(req, res, callback) {
        if (!callback) {
            throw new TypeError('argument callback is required')
        }

        let idx = 0
        let methods
        const protohost = getProtohost(req.url) || ''
        let removed = ''
        const self: any = this
        let slashAdded = false
        let sync = 0
        const paramcalled = {}

        // middleware and routes
        const stack = this.stack

        // manage inter-router variables
        const parentParams = req.params
        const parentUrl = req.baseUrl || ''
        let done = restore(callback, req, 'baseUrl', 'next', 'params')

        // setup next layer
        req.next = next

        // for options requests, respond with a default if nothing else responds
        if (req.method === 'OPTIONS') {
            methods = []
            done = wrap(done, generateOptionsResponder(res, methods))
        }

        // setup basic req values
        req.baseUrl = parentUrl
        req.originalUrl = req.originalUrl || req.url

        next()

        function next(err?: any) {
            let layerError: any = err === 'route'
                ? null
                : err

            // remove added slash
            if (slashAdded) {
                req.url = req.url.slice(1)
                slashAdded = false
            }

            // restore altered req.url
            if (removed.length !== 0) {
                req.baseUrl = parentUrl
                req.url = protohost + removed + req.url.slice(protohost.length)
                removed = ''
            }

            // signal to exit router
            if (layerError === 'router') {
                setImmediate(done, null)
                return
            }

            // no more matching layers
            if (idx >= stack.length) {
                setImmediate(done, layerError)
                return
            }

            // max sync stack
            if (++sync > 100) {
                return setImmediate(next, err)
            }

            // get pathname of request
            const path = getPathname(req)

            if (path == null) {
                return done(layerError)
            }

            // find next matching layer
            let layer
            let match
            let route

            while (match !== true && idx < stack.length) {
                layer = stack[idx++]
                match = matchLayer(layer, path)
                route = layer.route

                if (typeof match !== 'boolean') {
                    // hold on to layerError
                    layerError = layerError || match
                }

                if (match !== true) {
                    continue
                }

                if (!route) {
                    // process non-route handlers normally
                    continue
                }

                if (layerError) {
                    // routes do not match with a pending error
                    match = false
                    continue
                }

                const method = req.method
                const hasMethod = route._handlesMethod(method)

                // build up automatic options response
                if (!hasMethod && method === 'OPTIONS' && methods) {
                    methods.push.apply(methods, route._methods())
                }

                // don't even bother matching route
                if (!hasMethod && method !== 'HEAD') {
                    match = false
                    continue
                }
            }

            // no match
            if (match !== true) {
                return done(layerError)
            }

            // store route for dispatch on change
            if (route) {
                req.route = route
            }

            // Capture one-time layer values
            req.params = self.mergeParams
                ? mergeParams(layer.params, parentParams)
                : layer.params
            const layerPath = layer.path

            // this should be done for the layer
            processParams(self.params, layer, paramcalled, req, res, function (err) {
                if (err) {
                    next(layerError || err)
                } else if (route) {
                    layer.handleRequest(req, res, next)
                } else {
                    trimPrefix(layer, layerError, layerPath, path)
                }

                sync = 0
            })
        }

        function trimPrefix(layer, layerError, layerPath, path) {
            if (layerPath.length !== 0) {
                // Validate path is a prefix match
                if (layerPath !== path.substring(0, layerPath.length)) {
                    next(layerError)
                    return
                }

                // Validate path breaks on a path separator
                const c = path[layerPath.length]
                if (c && c !== '/') {
                    next(layerError)
                    return
                }

                // Trim off the part of the url that matches the route
                // middleware (.use stuff) needs to have the path stripped
                removed = layerPath
                req.url = protohost + req.url.slice(protohost.length + removed.length)

                // Ensure leading slash
                if (!protohost && req.url[0] !== '/') {
                    req.url = '/' + req.url
                    slashAdded = true
                }

                // Setup base URL (no trailing slash)
                req.baseUrl = parentUrl + (removed[removed.length - 1] === '/'
                    ? removed.substring(0, removed.length - 1)
                    : removed)
            }

            if (layerError) {
                layer.handleError(layerError, req, res, next)
            } else {
                layer.handleRequest(req, res, next)
            }
        }
    }

    use(handler) {
        let offset = 0
        let path = '/'

        // default path to '/'
        // disambiguate router.use([handler])
        if (typeof handler !== 'function') {
            let arg = handler

            while (Array.isArray(arg) && arg.length !== 0) {
                arg = arg[0]
            }

            // first arg is the path
            if (typeof arg !== 'function') {
                offset = 1
                path = handler
            }
        }

        const callbacks = flatten.call(slice.call(arguments, offset), Infinity)

        if (callbacks.length === 0) {
            throw new TypeError('argument handler is required')
        }

        for (let i = 0; i < callbacks.length; i++) {
            const fn = callbacks[i]

            if (typeof fn !== 'function') {
                throw new TypeError('argument handler must be a function')
            }

            // add the middleware
            const layer:any = new Layer(path, {
                sensitive: this.caseSensitive,
                strict: false,
                end: false
            }, fn)

            layer.route = undefined

            this.stack.push(layer)
        }

        return this
    }

    route(path) {
        const route:any = new Route(path)

        const layer:any = new Layer(path, {
            sensitive: this.caseSensitive,
            strict: this.strict,
            end: true
        }, handle)

        function handle(req, res, next) {
            route.dispatch(req, res, next)
        }

        layer.route = route

        this.stack.push(layer)
        return route
    }

}

methods.concat('all').forEach(function (method) {
    Router.prototype[method] = function (path) {
        const route = this.route(path)
        route[method].apply(route, slice.call(arguments, 1))
        return this
    }
})


function getProtohost(url) {
    if (typeof url !== 'string' || url.length === 0 || url[0] === '/') {
        return undefined
    }

    const searchIndex = url.indexOf('?')
    const pathLength = searchIndex !== -1
        ? searchIndex
        : url.length
    const fqdnIndex = url.substring(0, pathLength).indexOf('://')

    return fqdnIndex !== -1
        ? url.substring(0, url.indexOf('/', 3 + fqdnIndex))
        : undefined
}

function restore(fn: Function, obj: any, ...args): any {
    const props = new Array(args.length - 2)
    const vals = new Array(args.length - 2)

    for (let i = 0; i < props.length; i++) {
        props[i] = args[i + 2]
        vals[i] = obj[props[i]]
    }

    return function (this: any) {
        // restore vals
        for (let i = 0; i < props.length; i++) {
            obj[props[i]] = vals[i]
        }

        return fn.apply(this, args)
    }
}

function wrap(old, fn) {
    return function proxy(this: any) {
        const args = new Array(arguments.length + 1)

        args[0] = old
        for (let i = 0, len = arguments.length; i < len; i++) {
            args[i + 1] = arguments[i]
        }

        fn.apply(this, args)
    }
}

function generateOptionsResponder(res, methods) {
    return function onDone(fn, err) {
        if (err || methods.length === 0) {
            return fn(err)
        }

        trySendOptionsResponse(res, methods, fn)
    }
}

function trySendOptionsResponse(res, methods, next) {
    try {
        sendOptionsResponse(res, methods)
    } catch (err) {
        next(err)
    }
}

function sendOptionsResponse(res, methods) {
    const options = Object.create(null)

    // build unique method map
    for (let i = 0; i < methods.length; i++) {
        options[methods[i]] = true
    }

    // construct the allow list
    const allow = Object.keys(options).sort().join(', ')

    // send response
    res.setHeader('Allow', allow)
    res.setHeader('Content-Length', Buffer.byteLength(allow))
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.end(allow)
}


function getPathname(req) {
    try {
        return parseUrl(req).pathname
    } catch (err) {
        return undefined
    }
}

function matchLayer(layer, path) {
    try {
        return layer.match(path)
    } catch (err) {
        return err
    }
}

function mergeParams(params, parent) {
    if (typeof parent !== 'object' || !parent) {
        return params
    }

    // make copy of parent for base
    const obj = mixin({}, parent)

    // simple non-numeric merging
    if (!(0 in params) || !(0 in parent)) {
        return mixin(obj, params)
    }

    let i = 0
    let o = 0

    // determine numeric gap in params
    while (i in params) {
        i++
    }

    // determine numeric gap in parent
    while (o in parent) {
        o++
    }

    // offset numeric indices in params before merge
    for (i--; i >= 0; i--) {
        params[i + o] = params[i]

        // create holes for the merge when necessary
        if (i < o) {
            delete params[i]
        }
    }

    return mixin(obj, params)
}

function processParams(params, layer, called, req, res, done) {
    // captured parameters from the layer, keys and values
    const keys = layer.keys

    // fast track
    if (!keys || keys.length === 0) {
        return done()
    }

    let i = 0
    let paramIndex = 0
    let key
    let paramVal
    let paramCallbacks
    let paramCalled

    // process params in order
    // param callbacks can be async
    function param(err?: any) {
        if (err) {
            return done(err)
        }

        if (i >= keys.length) {
            return done()
        }

        paramIndex = 0
        key = keys[i++]
        paramVal = req.params[key]
        paramCallbacks = params[key]
        paramCalled = called[key]

        if (paramVal === undefined || !paramCallbacks) {
            return param()
        }

        // param previously called with same value or error occurred
        if (paramCalled && (paramCalled.match === paramVal ||
            (paramCalled.error && paramCalled.error !== 'route'))) {
            // restore value
            req.params[key] = paramCalled.value

            // next param
            return param(paramCalled.error)
        }

        called[key] = paramCalled = {
            error: null,
            match: paramVal,
            value: paramVal
        }

        paramCallback()
    }

    // single param callbacks
    function paramCallback(err?: any) {
        const fn = paramCallbacks[paramIndex++]

        // store updated value
        paramCalled.value = req.params[key]

        if (err) {
            // store error
            paramCalled.error = err
            param(err)
            return
        }

        if (!fn) return param()

        try {
            const ret = fn(req, res, paramCallback, paramVal, key)
            if (isPromise(ret)) {
                ret.then(null, function (error) {
                    paramCallback(error || new Error('Rejected promise'))
                })
            }
        } catch (e) {
            paramCallback(e)
        }
    }

    param()
}