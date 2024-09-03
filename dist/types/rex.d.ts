import bodyParser from 'body-parser';
import query from './middleware/query';
import serveStatic from 'serve-static';
import { Rex } from './types';
export declare const rex: {
    (): Rex;
    application: any;
    Route: (path: string) => void;
    Router: {
        (options?: any): import("./types").Router;
        param(name: string, fn: Function): void;
        handle(req: any, res: any, out: any): void;
        process_params(layer: any, called: any, req: any, res: any, done: any): any;
        use(fn: any, ...args: any[]): any;
        route(path: string): any;
    };
    json: (options?: bodyParser.OptionsJson) => import("connect").NextHandleFunction;
    query: typeof query;
    raw: (options?: bodyParser.Options) => import("connect").NextHandleFunction;
    static: typeof serveStatic;
    text: (options?: bodyParser.OptionsText) => import("connect").NextHandleFunction;
    urlencoded: (options?: bodyParser.OptionsUrlencoded) => import("connect").NextHandleFunction;
};
export default rex;
