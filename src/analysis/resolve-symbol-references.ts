import * as assert from 'assert';
import {ModuleDefinition, transformAst} from '../ast';
import {lookup, makeModuleScope, Scope} from '../ast'; // TODO: rename some of these...




export function resolveSymbolReferences(ast: ModuleDefinition) {
    let moduleScope = makeModuleScope();
    let currentScope: Scope = moduleScope;
    let result = transformAst(ast, {

        Block(block, transformChildren) {
            let restore = currentScope;
            currentScope = block.scope;
            block = transformChildren(block);
            currentScope = restore;
            return block;
        },

        Reference(ref) {
            let names = [...ref.namespaces || [], ref.name];
            let fullRef = names.join('.');
            let symbol = lookup(currentScope, names.shift()!);
            for (let name of names) {
                let nestedSymbol = symbol.members && symbol.members.find(s => s.name === name);
                if (nestedSymbol && !nestedSymbol.isExported) nestedSymbol = undefined;
                if (!nestedSymbol) throw new Error(`Symbol '${fullRef}' is not defined.`);
                symbol = nestedSymbol;
            }
            return {...ref, symbol};
        },
    });

    // sanity check - we should be back at the root scope here.
    assert(currentScope === moduleScope);

    // All done.
    return result;
}
