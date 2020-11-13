import * as path from 'path';
import {assert} from './assert';


// TODO: doc... branded type
export type AbsPath = string & {__brand: 'Normalised Absolute Path'};


export function AbsPath(p: string, basePath?: string): AbsPath {
    const isRelative = p.startsWith('.');
    if (isRelative) {
        assert(basePath); // sanity-check: must provide a base path if `p` is relative
        return path.resolve(basePath, p).replace(/\\/g, '/') as AbsPath;
    }
    else {
        assert(basePath === undefined); // sanity-check: must NOT provide a base path if `p` is absolute
        return p.replace(/\\/g, '/') as AbsPath;
    }
}
