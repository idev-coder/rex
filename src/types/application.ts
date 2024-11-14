
export interface IInit {
    (): void
}

export interface IDefaultConfiguration {
    (): void
}

export interface IPath {
    (): void
}

export interface IListen {
    (): void
}

export interface IHandle {
    (req: any, res: any, callback: any): any
}

export interface IRoute {
    (path: any): any
}

export interface IParam {
    (name: any, fn: Function): any
}
export interface ISet {
    (setting: any, val?: any): any
}

export interface IEnabled {
    (setting: any): any
}

export interface IDisabled {
    (setting: any): any
}

export interface IEnable {
    (setting: any): any
}

export interface IDisable {
    (setting: any): any
}

export interface IAll {
    (path: any): any
}

export interface IApplication {
    [x: string]: any;
    cache:any
    init: IInit;
    defaultConfiguration: IDefaultConfiguration;
    handle: IHandle;
    route: IRoute;
    param: IParam;
    set: ISet;
    path: IPath;
    enabled: IEnabled;
    disabled: IDisabled;
    enable: IEnable;
    disable: IDisable;
    all: IAll;
    listen:IListen
}