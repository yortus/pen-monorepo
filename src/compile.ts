import {CompilerOptions} from './compiler-options';
import {createSourceFileGraph} from './transforms';
import {parseSourceFiles} from './transforms';
import {createSymbolDefinitions} from './transforms';
import {resolveSymbolReferences} from './transforms';
import {generateTargetCode} from './transforms';


export function compile(compilerOptions: CompilerOptions) {
    let sourceFiles = createSourceFileGraph(compilerOptions);
    let ast01 = parseSourceFiles(sourceFiles);
    let ast02 = createSymbolDefinitions(ast01);
    let ast03 = resolveSymbolReferences(ast02);
    let ast04 = generateTargetCode(ast03);

    let result = `// tslint:disable: all\n`;
    for (let [, code] of ast04.entries()) {
        result += code;
    }
    return result;
}
