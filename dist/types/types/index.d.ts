import { SendOptions } from "send";
declare global {
    namespace Rex {
        interface Request {
        }
        interface Response {
        }
        interface Locals {
        }
        interface Application {
        }
    }
}
import { EventEmitter } from "events";
import * as http from "http";
import { ParsedQs } from "qs";
import { Options as RangeParserOptions, Ranges as RangeParserRanges, Result as RangeParserResult } from "range-parser";
export {};
export type Query = ParsedQs;
export interface NextFunction {
    (err?: any): void;
    (deferToNext: "router"): void;
    (deferToNext: "route"): void;
}
export interface Dictionary<T> {
    [key: string]: T;
}
export interface ParamsDictionary {
    [key: string]: string;
}
export type ParamsArray = string[];
export type Params = ParamsDictionary | ParamsArray;
export interface Locals extends Rex.Locals {
}
export interface RequestHandler<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>> {
    (req: Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>, res: Response<ResBody, LocalsObj>, next: NextFunction): void;
}
export type ErrorRequestHandler<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>> = (err: any, req: Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>, res: Response<ResBody, LocalsObj>, next: NextFunction) => void;
export type PathParams = string | RegExp | Array<string | RegExp>;
export type RequestHandlerParams<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>> = RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj> | ErrorRequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj> | Array<RequestHandler<P> | ErrorRequestHandler<P>>;
type RemoveTail<S extends string, Tail extends string> = S extends `${infer P}${Tail}` ? P : S;
type GetRouteParameter<S extends string> = RemoveTail<RemoveTail<RemoveTail<S, `/${string}`>, `-${string}`>, `.${string}`>;
export type RouteParameters<Route extends string> = string extends Route ? ParamsDictionary : Route extends `${string}(${string}` ? ParamsDictionary : Route extends `${string}:${infer Rest}` ? (GetRouteParameter<Rest> extends never ? ParamsDictionary : GetRouteParameter<Rest> extends `${infer ParamName}?` ? {
    [P in ParamName]?: string;
} : {
    [P in GetRouteParameter<Rest>]: string;
}) & (Rest extends `${GetRouteParameter<Rest>}${infer Next}` ? RouteParameters<Next> : unknown) : {};
export interface IRouterMatcher<T, Method extends "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head" = any> {
    <Route extends string, P = RouteParameters<Route>, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>>(path: Route, ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>): T;
    <Path extends string, P = RouteParameters<Path>, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>>(path: Path, ...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody, ReqQuery, LocalsObj>>): T;
    <P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>>(path: PathParams, ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>): T;
    <P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>>(path: PathParams, ...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody, ReqQuery, LocalsObj>>): T;
    (path: PathParams, subApplication: Application): T;
}
export interface IRouterHandler<T, Route extends string = string> {
    (...handlers: Array<RequestHandler<RouteParameters<Route>>>): T;
    (...handlers: Array<RequestHandlerParams<RouteParameters<Route>>>): T;
    <P = RouteParameters<Route>, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>>(...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>): T;
    <P = RouteParameters<Route>, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>>(...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody, ReqQuery, LocalsObj>>): T;
    <P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>>(...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>): T;
    <P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>>(...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody, ReqQuery, LocalsObj>>): T;
}
export interface IRouter extends RequestHandler {
    param(name: string, handler: RequestParamHandler): this;
    param(callback: (name: string, matcher: RegExp) => RequestParamHandler): this;
    all?: IRouterMatcher<this, "all">;
    get?: IRouterMatcher<this, "get">;
    post?: IRouterMatcher<this, "post">;
    put?: IRouterMatcher<this, "put">;
    delete?: IRouterMatcher<this, "delete">;
    patch?: IRouterMatcher<this, "patch">;
    options?: IRouterMatcher<this, "options">;
    head?: IRouterMatcher<this, "head">;
    checkout?: IRouterMatcher<this>;
    connect?: IRouterMatcher<this>;
    copy?: IRouterMatcher<this>;
    lock?: IRouterMatcher<this>;
    merge?: IRouterMatcher<this>;
    mkactivity?: IRouterMatcher<this>;
    mkcol?: IRouterMatcher<this>;
    move?: IRouterMatcher<this>;
    "m-search"?: IRouterMatcher<this>;
    notify?: IRouterMatcher<this>;
    propfind?: IRouterMatcher<this>;
    proppatch?: IRouterMatcher<this>;
    purge?: IRouterMatcher<this>;
    report?: IRouterMatcher<this>;
    search?: IRouterMatcher<this>;
    subscribe?: IRouterMatcher<this>;
    trace?: IRouterMatcher<this>;
    unlock?: IRouterMatcher<this>;
    unsubscribe?: IRouterMatcher<this>;
    link?: IRouterMatcher<this>;
    unlink?: IRouterMatcher<this>;
    use?: IRouterHandler<this> & IRouterMatcher<this>;
    route<T extends string>(prefix: T): IRoute<T>;
    route(prefix: PathParams): IRoute;
    stack?: ILayer[];
}
export interface ILayer {
    route?: IRoute;
    name: string | "<anonymous>";
    params?: Record<string, any>;
    keys: string[];
    path?: string;
    method: string;
    regexp: RegExp;
    handle: (req: Request, res: Response, next: NextFunction) => any;
}
export interface IRoute<Route extends string = string> {
    path: string;
    stack: ILayer[];
    all: IRouterHandler<this, Route>;
    get: IRouterHandler<this, Route>;
    post: IRouterHandler<this, Route>;
    put: IRouterHandler<this, Route>;
    delete: IRouterHandler<this, Route>;
    patch: IRouterHandler<this, Route>;
    options: IRouterHandler<this, Route>;
    head: IRouterHandler<this, Route>;
    checkout: IRouterHandler<this, Route>;
    copy: IRouterHandler<this, Route>;
    lock: IRouterHandler<this, Route>;
    merge: IRouterHandler<this, Route>;
    mkactivity: IRouterHandler<this, Route>;
    mkcol: IRouterHandler<this, Route>;
    move: IRouterHandler<this, Route>;
    "m-search": IRouterHandler<this, Route>;
    notify: IRouterHandler<this, Route>;
    purge: IRouterHandler<this, Route>;
    report: IRouterHandler<this, Route>;
    search: IRouterHandler<this, Route>;
    subscribe: IRouterHandler<this, Route>;
    trace: IRouterHandler<this, Route>;
    unlock: IRouterHandler<this, Route>;
    unsubscribe: IRouterHandler<this, Route>;
}
export interface Router extends IRouter {
}
export interface CookieOptions {
    /** Convenient option for setting the expiry time relative to the current time in **milliseconds**. */
    maxAge?: number | undefined;
    /** Indicates if the cookie should be signed. */
    signed?: boolean | undefined;
    /** Expiry date of the cookie in GMT. If not specified or set to 0, creates a session cookie. */
    expires?: Date | undefined;
    /** Flags the cookie to be accessible only by the web server. */
    httpOnly?: boolean | undefined;
    /** Path for the cookie. Defaults to “/”. */
    path?: string | undefined;
    /** Domain name for the cookie. Defaults to the domain name of the app. */
    domain?: string | undefined;
    /** Marks the cookie to be used with HTTPS only. */
    secure?: boolean | undefined;
    /** A synchronous function used for cookie value encoding. Defaults to encodeURIComponent. */
    encode?: ((val: string) => string) | undefined;
    /**
     * Value of the “SameSite” Set-Cookie attribute.
     * @link https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1.
     */
    sameSite?: boolean | "lax" | "strict" | "none" | undefined;
    /**
     * Value of the “Priority” Set-Cookie attribute.
     * @link https://datatracker.ietf.org/doc/html/draft-west-cookie-priority-00#section-4.3
     */
    priority?: "low" | "medium" | "high";
    /** Marks the cookie to use partioned storage. */
    partitioned?: boolean | undefined;
}
export interface ByteRange {
    start: number;
    end: number;
}
export interface RequestRanges extends RangeParserRanges {
}
export type Errback = (err: Error) => void;
export interface Request<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>> extends http.IncomingMessage, Rex.Request {
    get(name: "set-cookie"): string[] | undefined;
    get(name: string): string | undefined;
    header(name: "set-cookie"): string[] | undefined;
    header(name: string): string | undefined;
    accepts(): string[];
    accepts(type: string): string | false;
    accepts(type: string[]): string | false;
    accepts(...type: string[]): string | false;
    acceptsCharsets(): string[];
    acceptsCharsets(charset: string): string | false;
    acceptsCharsets(charset: string[]): string | false;
    acceptsCharsets(...charset: string[]): string | false;
    acceptsEncodings(): string[];
    acceptsEncodings(encoding: string): string | false;
    acceptsEncodings(encoding: string[]): string | false;
    acceptsEncodings(...encoding: string[]): string | false;
    acceptsLanguages(): string[];
    acceptsLanguages(lang: string): string | false;
    acceptsLanguages(lang: string[]): string | false;
    acceptsLanguages(...lang: string[]): string | false;
    range(size: number, options?: RangeParserOptions): RangeParserRanges | RangeParserResult | undefined;
    accepted: MediaType[];
    param(name: string, defaultValue?: any): string;
    is(type: string | string[]): string | false | null;
    readonly protocol: string;
    readonly secure: boolean;
    readonly ip: string | undefined;
    readonly ips: string[];
    readonly subdomains: string[];
    readonly path: string;
    readonly hostname: string;
    readonly host: string;
    readonly fresh: boolean;
    readonly stale: boolean;
    readonly xhr: boolean;
    body: ReqBody;
    cookies: any;
    method: string;
    params: P;
    query: ReqQuery;
    route: any;
    signedCookies: any;
    originalUrl: string;
    url: string;
    baseUrl: string;
    app: Application;
    res?: Response<ResBody, LocalsObj> | undefined;
    next?: NextFunction | undefined;
}
export interface MediaType {
    value: string;
    quality: number;
    type: string;
    subtype: string;
}
export type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T;
export interface SendFileOptions extends SendOptions {
    /** Object containing HTTP headers to serve with the file. */
    headers?: Record<string, unknown>;
}
export interface DownloadOptions extends SendOptions {
    /** Object containing HTTP headers to serve with the file. The header `Content-Disposition` will be overridden by the filename argument. */
    headers?: Record<string, unknown>;
}
export interface Response<ResBody = any, LocalsObj extends Record<string, any> = Record<string, any>, StatusCode extends number = number> extends http.ServerResponse, Rex.Response {
    /**
     * Set status `code`.
     */
    status(code: StatusCode): this;
    sendStatus(code: StatusCode): this;
    links(links: any): this;
    send: Send<ResBody, this>;
    json: Send<ResBody, this>;
    jsonp: Send<ResBody, this>;
    sendFile(path: string, fn?: Errback): void;
    sendFile(path: string, options: SendFileOptions, fn?: Errback): void;
    sendfile(path: string): void;
    sendfile(path: string, options: SendFileOptions): void;
    sendfile(path: string, fn: Errback): void;
    sendfile(path: string, options: SendFileOptions, fn: Errback): void;
    download(path: string, fn?: Errback): void;
    download(path: string, filename: string, fn?: Errback): void;
    download(path: string, filename: string, options: DownloadOptions, fn?: Errback): void;
    contentType(type: string): this;
    type(type: string): this;
    format(obj: any): this;
    set(field: any): this;
    set(field: string, value?: string | string[]): this;
    header(field: any): this;
    header(field: string, value?: string | string[]): this;
    headersSent: boolean;
    get(field: string): string | undefined;
    clearCookie(name: string, options?: CookieOptions): this;
    cookie(name: string, val: string, options: CookieOptions): this;
    cookie(name: string, val: any, options: CookieOptions): this;
    cookie(name: string, val: any): this;
    location(url: string): this;
    redirect(url: string): void;
    redirect(status: number, url: string): void;
    /** @deprecated use res.redirect(status, url) instead */
    redirect(url: string, status: number): void;
    render(view: string, options?: object, callback?: (err: Error, html: string) => void): void;
    render(view: string, callback?: (err: Error, html: string) => void): void;
    locals: LocalsObj & Locals;
    charset: string;
    vary(field: string): this;
    app: Application;
    append(field: string, value?: string[] | string): this;
    req: Request;
}
export interface Handler extends RequestHandler {
}
export type RequestParamHandler = (req: Request, res: Response, next: NextFunction, value: any, name: string) => any;
export type ApplicationRequestHandler<T> = IRouterHandler<T> & IRouterMatcher<T> & ((...handlers: RequestHandlerParams[]) => T);
export interface Application<LocalsObj extends Record<string, any> = Record<string, any>> extends EventEmitter, IRouter, Rex.Application {
    (req: Request | http.IncomingMessage, res: Response | http.ServerResponse): any;
    init(): void;
    defaultConfiguration(): void;
    engine(ext: string, fn: (path: string, options: object, callback: (e: any, rendered?: string) => void) => void): this;
    set(setting: string, val: any): this;
    get: ((name: string) => any) & IRouterMatcher<this>;
    param(name: string | string[], handler: RequestParamHandler): this;
    param(callback: (name: string, matcher: RegExp) => RequestParamHandler): this;
    path(): string;
    enabled(setting: string): boolean;
    disabled(setting: string): boolean;
    /** Enable `setting`. */
    enable(setting: string): this;
    /** Disable `setting`. */
    disable(setting: string): this;
    render(name: string, options?: object, callback?: (err: Error, html: string) => void): void;
    render(name: string, callback: (err: Error, html: string) => void): void;
    listen(port: number, hostname: string, backlog: number, callback?: () => void): http.Server;
    listen(port: number, hostname: string, callback?: () => void): http.Server;
    listen(port: number, callback?: () => void): http.Server;
    listen(callback?: () => void): http.Server;
    listen(path: string, callback?: () => void): http.Server;
    listen(handle: any, listeningListener?: () => void): http.Server;
    router?: string;
    settings?: any;
    resource?: any;
    map?: any;
    locals?: LocalsObj & Locals;
    routes?: any;
    _router?: any;
    use?: ApplicationRequestHandler<this>;
    on: (event: string, callback: (parent: Application) => void) => this;
    mountpath?: string | string[];
}
export interface Rex extends Application {
    request: Request;
    response: Response;
}
