export interface IHandleError {
    (error: any, req: any, res: any, next: Function): any
}

export interface IHandleRequest  {
    (req: any, res: any, next: Function): any
}

export interface IMatch {
    (path: any): any
}

export interface ILayer {
    [x: string]: any;
    handle?: any;
    keys?: any;
    name?: any;
    params?: any;
    path?: any;
    stack?: any[];
    slash?: any;
    matchers?: any;
    route?: any;
    handleError: IHandleError;
    handleRequest:IHandleRequest;
    match: IMatch
}

