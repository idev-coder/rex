export declare const proto: {
    (options: any): void;
    param(name: string, fn: Function): void;
    handle(req: any, res: any, out: any): void;
    process_params(layer: any, called: any, req: any, res: any, done: any): any;
    use(fn: any, ...args: any[]): any;
    route(path: string): any;
};
export default proto;
