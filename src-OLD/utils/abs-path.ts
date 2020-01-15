import * as path from 'path';


// TODO: doc... branded type
export type AbsPath = string & {__brand: 'Normalised Absolute Path'};


export function AbsPath(p: string, basePath?: string) {
    let result = basePath ? path.resolve(basePath, p) : path.resolve(p);
    return result as AbsPath;
}
