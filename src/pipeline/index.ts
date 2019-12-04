import {gatherSourceFiles} from './phases/01-gather-source-files';
import {parseSourceFiles} from './phases/02-parse-source-files';
import {identifySymbolsAndScopes} from './phases/03-identify-symbols-and-scopes';
import {CompilerOptions} from './representations/00-validated-compiler-options';


export {CompilerOptions};


export function pipeline(compilerOptions: CompilerOptions) {
    let rep01 = gatherSourceFiles(compilerOptions);
    let rep02 = parseSourceFiles(rep01);
    let rep03 = identifySymbolsAndScopes(rep02);
    return rep03;
}
