import {gatherSourceFiles} from './phases/01-gather-source-files';
import {parseSourceFiles} from './phases/02-parse-source-files';
import {createSymbolDefinitions} from './phases/03-create-symbol-definitions';
import {resolveSymbolReferences} from './phases/04-resolve-symbol-references';
import {CompilerOptions} from './representations/00-validated-compiler-options';


export {CompilerOptions};


export function pipeline(compilerOptions: CompilerOptions) {
    let rep01 = gatherSourceFiles(compilerOptions);
    let rep02 = parseSourceFiles(rep01);
    let rep03 = createSymbolDefinitions(rep02);
    let rep04 = resolveSymbolReferences(rep03);
    return rep04;
}
