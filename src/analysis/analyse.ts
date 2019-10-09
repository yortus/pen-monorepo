import {Module} from '../ast';
import {parse} from './parse';
import {resolveSymbolDefinitions} from './resolve-symbol-definitions';
import {resolveSymbolReferences} from './resolve-symbol-references';




export function analyse(moduleSourceText: string): Module<'pass2'> {

    // Parse pen module source code into an AST.
    let ast = parse(moduleSourceText);

    // TODO: more checking and analysis of AST...

    // Define all symbols within their scopes.
    let ast2 = resolveSymbolDefinitions(ast);

    // Resolve all references to symbols defined in the previous pass.
    let ast3 = resolveSymbolReferences(ast2);

    // All done.
    return ast3;
}
