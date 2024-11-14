import EventEmitter from "events";
import mixin from 'merge-descriptors'
import req from "./request";
import res from "./response";
import proto from './application'
import { Route as RexRoute } from './route'
import { Router as RexRouter } from './router'
import bodyParser from 'body-parser'
import { IApp } from "./types/app";
import serveStatic from "serve-static";


export function createApplication() {
  const app: IApp = function (req: any, res: any, next: any) {
    app.handle(req, res, next)
  }
  mixin(app, EventEmitter.prototype, false);
  mixin(app, proto, false);

  // expose the prototype that will get set on requests
  app.request = Object.create(req, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })

  // expose the prototype that will get set on responses
  app.response = Object.create(res, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })

  return app
}

export const application = proto
export const request = req
export const response = res
export const Route = RexRoute
export const Router = RexRouter
export const json = bodyParser.json;
export const raw = bodyParser.raw;
export const text = bodyParser.text;
export const urlencoded = bodyParser.urlencoded;
export const _static = serveStatic

export default createApplication