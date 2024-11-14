export interface IApp {
    (req:any, res:any, next:any): void;
    [x: string]: any;
    handle?: any;
    request?: any;
    response?: any;
}
