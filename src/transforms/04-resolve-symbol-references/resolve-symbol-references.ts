import {Node, Program} from '../../ast-nodes';
import {Scope} from '../../scope';
import {assert, makeNodeMapper} from '../../utils';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from './symbol-references';


// TODO: doc...
export function resolveSymbolReferences(program: Program<SymbolDefinitions>) {
    const symbolTable = program.meta.symbolTable;
    let currentScope: Scope | undefined;
    let mapNode = makeNodeMapper<Node<SymbolDefinitions>, Node<SymbolDefinitions & SymbolReferences>>();
    let result = mapNode(program, rec => ({

        // Keep track of the current scope.
        Module: mod => {
            currentScope = mod.meta.scope;
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            currentScope = currentScope.parent;
            return modᐟ;
        },

        // Resolve symbol references.
        ReferenceExpression: ref => {
            assert(currentScope !== undefined);
            let symbol = symbolTable.lookup(ref.name, currentScope);
            let refᐟ = {...ref, meta: {symbolId: symbol.id}};
            return refᐟ;
        },

        // TODO: lookup sme.memberName inside scope of sme.namespace (recursive)
        // BindingLookupExpression: look => {
        //     assert(currentScope !== undefined);

        //     let lookᐟ = {...look, module: rec(look.module), meta: {symbolId: symbol.id}};
        //     return lookᐟ;
        // },
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}
