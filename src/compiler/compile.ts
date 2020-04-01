import * as fs from 'fs-extra';
import * as path from 'path';
import {CompilerOptions} from './compiler-options';
import {createSourceFileGraph} from './transforms';
import {parseSourceFiles} from './transforms';
import {createSymbolDefinitions} from './transforms';
import {resolveSymbolReferences} from './transforms';
import {generateTargetCode} from './transforms';


export function compile(compilerOptions: CompilerOptions) {

    // Collect all source files in the compilation.
    let sourceFiles = createSourceFileGraph(compilerOptions);

    // Proceed through all stages in the compiler pipeline.
    let ast01 = parseSourceFiles(sourceFiles);
    let ast02 = createSymbolDefinitions(ast01);
    let ast03 = resolveSymbolReferences(ast02);
    let targetCode = generateTargetCode(ast03);

    // write the target code to the output file path. Creating containing dirs if necessary.
    fs.ensureDir(path.dirname(compilerOptions.outFile));
    fs.writeFileSync(path.resolve(compilerOptions.outFile), targetCode);
}
