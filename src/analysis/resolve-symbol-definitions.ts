import * as assert from 'assert';
import {ModuleDefinition, transformAst} from '../ast';
import {insert, makeModuleScope, makeNestedScope, Scope} from '../ast'; // TODO: rename some of these...




export function resolveSymbolDefinitions(ast: ModuleDefinition<'pass2'>) {
    let moduleScope = makeModuleScope();
    let currentScope: Scope = moduleScope;
    let blockNestingLevel = 0;
    let result = transformAst(ast, {

        Block(block, transformChildren) {
            let restore = {currentScope, blockNestingLevel};
            if (blockNestingLevel > 0) currentScope = makeNestedScope(currentScope);
            blockNestingLevel += 1;
            block = {...transformChildren(block), scope: currentScope};
            ({currentScope, blockNestingLevel} = restore);
            return block;
        },

        Definition(def, transformChildren) {
            let symbol = insert(currentScope, def.name);
            symbol.isExported = def.isExported;
            def = {...transformChildren(def), symbol};
            if (def.expression.kind === 'Block') {
                symbol.members = [...def.expression.scope.symbols.values()].filter(s => s.isExported);
            }
            return def;
        },

        ImportNames(imp) {
            assert(currentScope === moduleScope); // sanity check
            let symbols = imp.names.map(name => Object.assign(insert(currentScope, name), {isImported: true}));
            return {...imp, symbols};
        },

        ImportNamespace(imp) {
            assert(currentScope === moduleScope); // sanity check
            let symbol = insert(currentScope, imp.namespace); // TODO: what about alias?
            symbol.isImported = true;


            // TODO: temp testing... hardcode some 'pen' exports for testing...
            if (imp.moduleSpecifier === 'pen') {
                symbol.members = [
                    {name: 'i32', isExported: true},
                    {name: 'Memoize', isExported: true},
                ];
            }


            return {...imp, symbol};
        },
    });

    // sanity check - we should be back at the root scope here.
    assert(currentScope === moduleScope);

    // All done.
    return result;
}
