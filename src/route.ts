import { Layer } from './layer'
import { METHODS } from 'http'

const slice = Array.prototype.slice
const flatten = Array.prototype.flat
const methods = METHODS.map((method) => method.toLowerCase())

const defer:any = typeof setImmediate === 'function'
? setImmediate
: function (fn: Function, ...args: any[]) {
    process.nextTick(fn.bind(null, ...args));
};

export class Route {
    path: any
    stack: any
    methods: any
    constructor(path) {
        this.path = path
        this.stack = []

        // route handlers for various http methods
        this.methods = Object.create(null)
    }

    _handlesMethod(method) {
        if (this.methods._all) {
            return true
        }

        // normalize name
        let name = typeof method === 'string'
            ? method.toLowerCase()
            : method

        if (name === 'head' && !this.methods.head) {
            name = 'get'
        }

        return Boolean(this.methods[name])
    }

    _methods() {
        const methods = Object.keys(this.methods)

        // append automatic head
        if (this.methods.get && !this.methods.head) {
            methods.push('head')
        }

        for (let i = 0; i < methods.length; i++) {
            // make upper case
            methods[i] = methods[i].toUpperCase()
        }

        return methods
    }

    dispatch(req, res, done) {
        let idx = 0
        const stack = this.stack
        let sync = 0

        if (stack.length === 0) {
            return done()
        }

        let method = typeof req.method === 'string'
            ? req.method.toLowerCase()
            : req.method

        if (method === 'head' && !this.methods.head) {
            method = 'get'
        }

        req.route = this

        next()

        function next(err?: any): any {
            // signal to exit route
            if (err && err === 'route') {
                return done()
            }

            // signal to exit router
            if (err && err === 'router') {
                return done(err)
            }

            // no more matching layers
            if (idx >= stack.length) {
                return done(err)
            }

            // max sync stack
            if (++sync > 100) {
                return defer(next, err)
            }

            let layer
            let match

            // find next matching layer
            while (match !== true && idx < stack.length) {
                layer = stack[idx++]
                match = !layer.method || layer.method === method
            }

            // no match
            if (match !== true) {
                return done(err)
            }

            if (err) {
                layer.handleError(err, req, res, next)
            } else {
                layer.handleRequest(req, res, next)
            }

            sync = 0
        }
    }

    all(handler) {
        const callbacks = flatten.call(slice.call(arguments), Infinity)

        if (callbacks.length === 0) {
            throw new TypeError('argument handler is required')
        }

        for (let i = 0; i < callbacks.length; i++) {
            const fn = callbacks[i]

            if (typeof fn !== 'function') {
                throw new TypeError('argument handler must be a function')
            }

            const layer:any = new Layer('/', {}, fn)
            layer.method = undefined

            this.methods._all = true
            this.stack.push(layer)
        }

        return this
    }

}

methods.forEach(function (method) {
    Route.prototype[method] = function (handler) {
      const callbacks = flatten.call(slice.call(arguments), Infinity)
  
      if (callbacks.length === 0) {
        throw new TypeError('argument handler is required')
      }
  
      for (let i = 0; i < callbacks.length; i++) {
        const fn = callbacks[i]
  
        if (typeof fn !== 'function') {
          throw new TypeError('argument handler must be a function')
        }
  
        const layer:any = new Layer('/', {}, fn)
        layer.method = method
  
        this.methods[method] = true
        this.stack.push(layer)
      }
  
      return this
    }
  })