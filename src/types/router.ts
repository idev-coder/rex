export interface IParam {
    (name: any, fn: Function): any
}

export interface IHandle {
    (req: any, res: any, callback: Function): any
}

export interface IUse {
    (handler: any): any
}

export interface IRoute {
    (handler: any): any
}

export interface IRouter {
    (req: any, res: any, next: any): void;
    [x: string]: any;
    params?: any;
    caseSensitive?: any;
    mergeParams?:any
    strict?: any;
    stack?: any[];
    param: IParam;
    handle: IHandle;
    use: IUse;
    route: IRoute;

}

