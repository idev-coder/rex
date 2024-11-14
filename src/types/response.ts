
export interface IStatus {
    (code: number): any
}

export interface ILinks {
    (links: {
        next: string;
        last: string
    }): any
}

export interface ISend {
    (body: string | number | boolean | object | Buffer): any
}

export interface IJson {
    (obj: string | number | boolean | object): any
}

export interface ISendFile {
    (path: string, options: any, callback: any): any
}

export interface IDownload {
    (path: string, filename: any, options: any, callback: any): any
}

export interface IType {
    (type: string): any
}

export interface IFormat {
    (obj: {
        text: { (): any };
        html: { (): any };
        json: { (): any };
        default: { (): any };
    } | any): any
}

export interface IAttachment {
    (filename: string): any
}

export interface IAppend {
    (field: string, val: string | any[]): any
}

export interface IHeader {
    (field: string | any, val: string | any[]): any
}

export interface IClearCookie {
    (name: string | any, options: any): any
}

export interface ICookie {
    (name: string | any, value: any, options: any): any
}

export interface ILocation {
    (url: string | any): any
}

export interface IRedirect {
    (url: string | any): any
}

export interface IVary {
    (field: string | any): any
}

export interface IRender {
    (view: any, options: any, callback: any): any
}


export interface IResponse {
    [x: string]: any;
    status: IStatus;
    links: ILinks;
    send: ISend;
    json: IJson;
    jsonp: IJson;
    statusCode: IStatus | any;
    sendFile: ISendFile
    download: IDownload;
    type: IType;
    contentType: IType;
    format: IFormat;
    attachment: IAttachment;
    append: IAppend;
    header: IHeader;
    set: IHeader;
    clearCookie: IClearCookie;
    cookie: ICookie;
    location: ILocation;
    redirect: IRedirect;
    vary: IVary;
    render: IRender
}