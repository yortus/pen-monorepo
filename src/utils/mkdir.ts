import * as mk from 'mkdirp';


export function mkdirp(path: string) {
    mk.sync(path, {});
}
