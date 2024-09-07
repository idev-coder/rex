/// <reference types="node" />

type EngineOptions = {
    transformViews?: boolean;
    doctype?: string;
    beautify?: boolean;
    babel?: any;
};

declare function createEngine(engineOptions?: EngineOptions): (filename: any, options: any, cb: any) => any
export = createEngine