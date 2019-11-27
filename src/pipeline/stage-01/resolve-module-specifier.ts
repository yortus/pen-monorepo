import * as fs from 'fs';
import * as path from 'path';


// TODO: doc... returns an absolute normalised file path
// TODO: doc... `fromPath`, if given, *must* be the absolute path to a file (the parent/importing module).
// TODO: doc... if `fromPath` is not provided, `modSpec` is resolved relative to the CWD.
export function resolveModuleSpecifier(modSpec: string, fromPath?: string) {
    // TODO: assert `fromPath` is blank or points to an existing *file* (not dir)

    // 1. If `modSpec` is a core module
    if (modSpec === 'pen') {
        return path.resolve(CORE_LIBS_PATH, 'penlib.pen');
    }

    // 2. If `modSpec` is a relative path
    if (modSpec.startsWith('.')) {
        let baseDir = fromPath ? path.dirname(fromPath) : process.cwd();
        modSpec = path.resolve(baseDir, modSpec);
    }

    // 3. If `modSpec` is an absolute path
    return tryPath(modSpec)
        || tryPath(modSpec + '.pen')
        || tryPath(path.join(modSpec, 'index.pen'))
        || fail(modSpec);
}


function tryPath(p: string) {
    if (!fs.existsSync(p)) return undefined;
    if (!fs.statSync(p).isFile()) return undefined;
    return p;
}


function fail(modSpec: string): never {
    throw new Error(`Failed to resolve module '${modSpec}'`);
}


// TODO: use more robust way of locating lib files & third-party deps
const CORE_LIBS_PATH = path.join(__dirname, '../../../penlib');
