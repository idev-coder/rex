export interface IDispatch {
    (req: any, res: any, done: any): any
}

export interface IHandlesMethod {
    (method: any): any
}

export interface IMethods {
    (): any
}

export interface IAll {
    (handler?: any): any
}

export interface IRoute {
    [x: string]: any;
    methods?: any;
    path?: any;
    stack?: any[];
    _handlesMethod: IHandlesMethod;
    _methods: IMethods;
    dispatch: IDispatch;
    all: IAll
}

