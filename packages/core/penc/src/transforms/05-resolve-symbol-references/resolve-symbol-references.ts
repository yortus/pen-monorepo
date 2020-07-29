import {Node, Program} from '../../ast-nodes';
import {ScopeSymbol} from '../../symbol-table';
import {assert, makeNodeMapper} from '../../utils';
import {Metadata as OldMetadata} from '../04-create-symbol-definitions';
import {Metadata as NewMetadata} from './metadata';


// TODO: doc...
export function resolveSymbolReferences(program: Program<OldMetadata>) {
    const {symbolTable} = program.meta;
    let currentScope: ScopeSymbol | undefined;
    let mapNode = makeNodeMapper<Node<OldMetadata>, Node<NewMetadata>>();
    let result = mapNode(program, rec => ({

        // Keep track of the current scope.
        Module: mod => {
            let outerScope = currentScope;
            currentScope = mod.meta.scope;
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            currentScope = outerScope;
            return modᐟ;
        },

        // Resolve symbol references.
        ReferenceExpression: ref => {
            assert(currentScope);
            let symbol = symbolTable.lookupName(ref.name, currentScope);
            let refᐟ = {...ref, meta: {symbolId: symbol.id}};
            return refᐟ;
        },
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}
