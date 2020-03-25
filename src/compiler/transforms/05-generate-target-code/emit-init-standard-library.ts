import * as fs from 'fs-extra';
import * as path from 'path';
import * as pkgDir from 'pkg-dir';
import {assert} from '../../utils';
import {Emitter} from './emitter';


const PKG_DIR = pkgDir.sync(__filename);
assert(PKG_DIR);
const STD_DIR = path.join(PKG_DIR, 'dist/standard-library');
assert(fs.existsSync(STD_DIR));


// TODO: temp testing...
export function emitInitStandardLibrary(emit: Emitter) {
    emit.down(2).text(`function initStandardLibrary() {`).indent();
    const filenames = fs.readdirSync(STD_DIR).filter(fn => path.extname(fn) === '.js').sort(compareFilenames);
    for (let filename of filenames) {
        let absPath = path.join(STD_DIR, filename);
        let content = fs.readFileSync(absPath, 'utf8') + '\n';
        content = content.replace(/"use strict";[\r\n]*/, '').replace(/\/\/# sourceMappingURL.*/, '');
        content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => {
            emit.down(1).text(line);
        });
    }
    emit.dedent().down(1).text('}\n');
}


function compareFilenames(a: string, b: string) {
    if (a === '[prolog].js' || b === '[epilog].js') return -1;
    if (a === '[epilog].js' || b === '[prolog].js') return 1;
    return a === b ? 0 : a < b ? -1 : 1;
}
