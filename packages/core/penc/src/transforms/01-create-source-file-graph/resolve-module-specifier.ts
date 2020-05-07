import * as fs from 'fs';
import * as path from 'path';
import {AbsPath} from '../../utils';


// TODO: doc... returns an absolute normalised file path
// TODO: doc... `fromPath`, if given, *must* be the absolute path to a file (the parent/importing module).
// TODO: doc... if `fromPath` is not provided, `modSpec` is resolved relative to the CWD.
export function resolveModuleSpecifier(modSpec: string, fromPath?: string): AbsPath {
    // TODO: assert `fromPath` is blank or points to an existing *file* (not dir)
    let absPath: AbsPath;

    // 1. If `modSpec` is a builtin module.
    if (modSpec === 'std') {
        absPath = AbsPath(STD_PATH);
    }
    else if (modSpec === 'experiments') {
        absPath = AbsPath(EXPERIMENTS_PATH);
    }

    // 2. If `modSpec` is a relative path.
    else if (modSpec.startsWith('.')) {
        let baseDir = fromPath ? path.dirname(fromPath) : process.cwd();
        absPath = AbsPath(modSpec, baseDir);
    }

    // 3. If `modSpec` is an absolute path.
    else {
        absPath = AbsPath(modSpec);
    }

    // Try an exact path match, then with a .pen extension, then with a .pen.js extension, then a directory module.
    return tryPath(absPath)
        || tryPath(AbsPath(absPath + '.pen'))
        || tryPath(AbsPath(absPath + '.pen.js'))
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


const STD_PATH = require.resolve('@ext/standard-library');
const EXPERIMENTS_PATH = require.resolve('@ext/experimental-features');
