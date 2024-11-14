
export interface IGet {
    (name: string): any
}

export interface IAccepts {
    (): any
}

export interface IRange {
    (size: any, options: any): any
}

export interface IIs {
    (types:any[]): any
}

export interface IHeader extends IGet { }
export interface IRequest {
    [x: string]: any;
    get: IGet;
    header: IHeader;
    accepts: IAccepts;
    acceptsEncodings: IAccepts;
    acceptsCharsets: IAccepts;
    acceptsLanguages: IAccepts;
    range: IRange;
    is:IIs
}