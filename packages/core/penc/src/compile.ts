// TODO: transform order is important
// - should it be reflected in the export names from './transforms'?
// - not if the param/return types basically dictate the order


import * as fs from 'fs-extra';
import * as path from 'path';
import {CompilerOptions} from './compiler-options';
import {createSourceFileGraph} from './transforms';
import {createModuleMap} from './transforms';
import {createDefinitionMap} from './transforms';
// import {desugarSyntax} from './transforms';
// import {resolveSymbols} from './transforms';
// import {checkSemantics} from './transforms';
// import {generateSingleExpression} from './transforms';
// import {resolveConstantValues} from './transforms';
// import {generateTargetCode} from './transforms';


export function compile(options: CompilerOptions) {

    // Parse and validate compiler options
    const main = path.resolve(options.main);
    const outFile = options.outFile || main.substr(0, main.length - path.extname(main).length) + '.js';
    if (main === outFile) throw new Error(`output would overwrite input`);

    // Collect all source files in the compilation.
    const sourceFiles = createSourceFileGraph({main});

    // Proceed through all stages in the compiler pipeline.
    const moduleMap = createModuleMap(sourceFiles);
    // const ast02 = desugarSyntax(ast01);
    // const ast03 = resolveSymbols(ast02);
    // checkSemantics(ast03);

    // const il = generateSingleExpression(ast03);
    // const consts = resolveConstantValues(il);
    // const targetCode = generateTargetCode({il, consts});

    // TODO: temp testing...
    const definitionMap = createDefinitionMap(moduleMap);
    [] = [moduleMap, definitionMap];
    const targetCode = `console.log('Hello, World!');\n`;

    // write the target code to the output file path. Creating containing dirs if necessary.
    const outFilePath = path.resolve(outFile);
    fs.ensureDirSync(path.dirname(outFilePath));
    fs.writeFileSync(outFilePath, targetCode);
}
