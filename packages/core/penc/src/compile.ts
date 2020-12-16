// TODO: transform order is important
// - should it be reflected in the export names from './transforms'?
// - not if the param/return types basically dictate the order


import * as fs from 'fs-extra';
import * as path from 'path';
import {CompilerOptions} from './compiler-options';
import {parseSourceFiles} from './transforms';
import {resolveSymbols} from './transforms';
import {normaliseExpressions} from './transforms';
import {resolveConstantValues} from './transforms';
import {generateTargetCode} from './transforms';
import {AbsPath} from './utils';


export function compile(options: CompilerOptions) {

    // Parse and validate compiler options
    const main = AbsPath(path.resolve(options.main));
    const outFile = options.outFile || main.substr(0, main.length - path.extname(main).length) + '.js';
    if (main === outFile) throw new Error(`output would overwrite input`);

    // Proceed through all stages in the compiler pipeline.
    const ast1 = parseSourceFiles({main});
    const ast2 = resolveSymbols(ast1);
    const ast3 = normaliseExpressions(ast2);
    const consts = resolveConstantValues(ast3);
    const targetCode = generateTargetCode({ast: ast3, consts});

    // write the target code to the output file path. Creating containing dirs if necessary.
    const outFilePath = path.resolve(outFile);
    fs.ensureDirSync(path.dirname(outFilePath));
    fs.writeFileSync(outFilePath, targetCode);
}
