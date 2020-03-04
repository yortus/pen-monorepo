// import * as fs from 'fs';
// import * as mkdirp from 'mkdirp';
// import * as path from 'path';
import {CompilerOptions} from './compiler-options';
import {createSourceFileGraph} from './transforms';
import {parseSourceFiles} from './transforms';
import {createSymbolDefinitions} from './transforms';
import {resolveSymbolReferences} from './transforms';
// import {generateTargetCode} from './transforms';


export function compile(compilerOptions: CompilerOptions) {
    let sourceFiles = createSourceFileGraph(compilerOptions);
    let ast01 = parseSourceFiles(sourceFiles);
    let ast02 = createSymbolDefinitions(ast01);
    let ast03 = resolveSymbolReferences(ast02);
    // let ast04 = generateTargetCode(ast03);

    // let result = `// tslint:disable: all\n`;
    // for (let [, code] of ast04.entries()) {
    //     result += code;
    // }

    // // write the target code to the output directory
    // let tempOutFilePath = path.join(compilerOptions.outDir, 'temp.ts');
    // mkdirp.sync(compilerOptions.outDir);
    // fs.writeFileSync(tempOutFilePath, result);


    [] = [ast03];

}
