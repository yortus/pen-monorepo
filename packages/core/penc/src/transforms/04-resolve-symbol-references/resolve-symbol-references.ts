import {Node, Program} from '../../ast-nodes';
import {assert, makeNodeMapper} from '../../utils';
import {Metadata as OldMetadata} from '../03-create-symbol-definitions';
import {Metadata as NewMetadata} from './metadata';


// TODO: doc...
export function resolveSymbolReferences(program: Program<OldMetadata>) {
    const {symbolTable} = program.meta;
    let currentScope = symbolTable.getRootScope();
    let mapNode = makeNodeMapper<Node<OldMetadata>, Node<NewMetadata>>();
    let result = mapNode(program, rec => ({

        // Keep track of the current scope.
        Module: mod => {
            currentScope = mod.meta.scope;
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            assert(currentScope.scope);
            currentScope = currentScope.scope;
            return modᐟ;
        },

        // Resolve import expressions.
        ImportExpression: imp => {
            let sourceFile = program.sourceFiles.get(imp.sourceFilePath)!;
            let scope = sourceFile.kind === 'PenSourceFile' ? sourceFile.module.meta.scope : sourceFile.meta.scope;
            let impᐟ = {...imp, meta: {scope}};
            return impᐟ;
        },

        // Resolve symbol references.
        ReferenceExpression: ref => {
            let symbol = symbolTable.lookupBySourceName(ref.name, currentScope);
            let refᐟ = {...ref, meta: {symbolId: symbol.id}};
            return refᐟ;
        },
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === symbolTable.getRootScope());

    // All done.
    return result;
}
