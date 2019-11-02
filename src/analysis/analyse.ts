import {Node} from '../ast2';
import {parse} from './parse';
import {resolveDefinitions} from './resolve-definitions';
import {resolveReferences} from './resolve-references';




export function analyse(moduleSourceText: string): Node<300, 'ModuleDefinition'> {

    // Parse pen module source code into an AST.
    let ast = parse(moduleSourceText);

    // TODO: more checking and analysis of AST...

    // Define all symbols within their scopes.
    let ast2 = resolveDefinitions(ast);

    // Resolve all references to symbols defined in the previous pass.
    let ast3 = resolveReferences(ast2); // TODO: remove cast

    // All done.
    return ast3;
}
