// TODO: transform order is important - it should be reflected in the export names from './transforms'


import * as fs from 'fs-extra';
import * as path from 'path';
import {CompilerOptions} from './compiler-options';
import {createSourceFileGraph} from './transforms';
import {parseSourceFiles} from './transforms';
import {desugarSyntax} from './transforms';
import {resolveSymbols} from './transforms';
import {checkSemantics} from './transforms';
import {createFlatExpressionList} from './transforms';
import {resolveConstantValues} from './transforms';
import {generateTargetCode} from './transforms';


export function compile(options: CompilerOptions) {

    // Parse and validate compiler options
    let main = path.resolve(options.main);
    let outFile = options.outFile || main.substr(0, main.length - path.extname(main).length) + '.js';
    if (main === outFile) throw new Error(`output would overwrite input`);

    // Collect all source files in the compilation.
    let sourceFiles = createSourceFileGraph({main});

    // Proceed through all stages in the compiler pipeline.
    let ast01 = parseSourceFiles(sourceFiles);
    let ast02 = desugarSyntax(ast01);
    let ast03 = resolveSymbols(ast02);
    checkSemantics(ast03);

    let il = createFlatExpressionList(ast03);
    let consts = resolveConstantValues(il);
    let targetCode = generateTargetCode({il, consts});

    // write the target code to the output file path. Creating containing dirs if necessary.
    let outFilePath = path.resolve(outFile);
    fs.ensureDirSync(path.dirname(outFilePath));
    fs.writeFileSync(outFilePath, targetCode);
}
