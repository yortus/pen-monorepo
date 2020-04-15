import * as path from 'path';


// TODO: doc... branded type
export type AbsPath =
    | (string & {__brand: 'Normalised Absolute Path'})
    | 'std'
    | 'experiments';


export function AbsPath(p: string, basePath?: string) {
    if (p === 'std' && !basePath) return 'std';
    if (p === 'experiments' && !basePath) return 'experiments';
    let result = basePath ? path.resolve(basePath, p) : path.resolve(p);
    return result as AbsPath;
}
