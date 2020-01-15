import * as fs from 'fs';
import * as path from 'path';
import {AbsPath} from '../../utils';


// TODO: doc... returns an absolute normalised file path
// TODO: doc... `fromPath`, if given, *must* be the absolute path to a file (the parent/importing module).
// TODO: doc... if `fromPath` is not provided, `modSpec` is resolved relative to the CWD.
export function resolveModuleSpecifier(modSpec: string, fromPath?: string): AbsPath {
    // TODO: assert `fromPath` is blank or points to an existing *file* (not dir)
    let absPath: AbsPath;

    // 1. If `modSpec` is a core module
    if (modSpec === 'pen') {
        absPath = AbsPath('penlib.pen', CORE_LIBS_PATH);
    }

    // 2. If `modSpec` is a relative path
    else if (modSpec.startsWith('.')) {
        let baseDir = fromPath ? path.dirname(fromPath) : process.cwd();
        absPath = AbsPath(modSpec, baseDir);
    }

    // 3. If `modSpec` is an absolute path
    else {
        absPath = AbsPath(modSpec);
    }

    // Try an exact path match, then adding a .pen extension, then a directory module
    return tryPath(absPath)
        || tryPath(AbsPath(absPath + '.pen'))
        || tryPath(AbsPath(path.join(absPath, 'index.pen')))
        || fail(modSpec);
}


function tryPath(p: AbsPath) {
    if (!fs.existsSync(p)) return undefined;
    if (!fs.statSync(p).isFile()) return undefined;
    return p;
}


function fail(modSpec: string): never {
    throw new Error(`Failed to resolve module '${modSpec}'`);
}


// TODO: use more robust way of locating lib files & third-party deps
const CORE_LIBS_PATH = path.join(__dirname, '../../../penlib');
