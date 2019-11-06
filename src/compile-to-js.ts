import {pipeline} from './pipeline';


export function compileToJs(source: PenSourceCode): JsTargetCode {
    return {code: pipeline(source.code)};
}


export interface PenSourceCode {
    code: string;
}


export interface JsTargetCode {
    code: string;
}
