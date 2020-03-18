// TODO: ensure exports.js (ie return {...}) is emitted last, otherwise there may be unreachable code emitted
// - maybe just put types+helpers+exports into a single specially-named file that is emitted last?

import * as fs from 'fs-extra';
import * as path from 'path';
import * as pkgDir from 'pkg-dir';
import {assert} from '../../utils';
import {Emitter} from './emitter';


const PKG_DIR = pkgDir.sync(__filename);
assert(PKG_DIR);
const SYS_DIR = path.join(PKG_DIR, 'dist/runtime-system');
assert(fs.existsSync(SYS_DIR));


// TODO: temp testing...
export function emitInitRuntimeSystem(emit: Emitter) {
    emit.down(2).text(`function initRuntimeSystem() {`).indent();
    const filenames = fs.readdirSync(SYS_DIR).filter(fn => path.extname(fn) === '.js');
    for (let filename of filenames) {
        let content = fs.readFileSync(path.join(SYS_DIR, filename), 'utf8') + '\n';
        content = content.replace(/"use strict";[\r\n]*/, '').replace(/\/\/# sourceMappingURL.*/, '');
        content.split(/[\r\n]+/).forEach(line => {
            emit.down(1).text(line);
        });
    }
    emit.dedent().down(1).text('}\n');
}
