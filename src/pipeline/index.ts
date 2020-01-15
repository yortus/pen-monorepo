import {CompilerOptions} from '../compiler-options';
import {createSourceFileGraph} from './phases/01-gather-source-files';
import {parseSourceFiles} from './phases/02-parse-source-files';
import {createSymbolDefinitions} from './phases/03-create-symbol-definitions';
import {resolveSymbolReferences} from './phases/04-resolve-symbol-references';


export function pipeline(compilerOptions: CompilerOptions) {
    let sourceFiles = createSourceFileGraph(compilerOptions);
    let ast01 = parseSourceFiles(sourceFiles);
    let ast02 = createSymbolDefinitions(ast01);
    let ast03 = resolveSymbolReferences(ast02);
    return ast03;
}
