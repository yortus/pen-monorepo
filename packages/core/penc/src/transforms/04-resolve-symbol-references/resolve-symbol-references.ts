import {Node, Program} from '../../ast-nodes';
import {EXPERIMENTS_SCOPE, STD_SCOPE} from '../../scope';
import {assert, makeNodeMapper} from '../../utils';
import {Metadata as OldMetadata} from '../03-create-symbol-definitions';
import {Metadata as NewMetadata} from './metadata';


// TODO: doc...
export function resolveSymbolReferences(program: Program<OldMetadata>) {
    const {rootScope, symbolTable} = program.meta;
    let currentScope = rootScope;
    let mapNode = makeNodeMapper<Node<OldMetadata>, Node<NewMetadata>>();
    let result = mapNode(program, rec => ({

        // Keep track of the current scope.
        Module: mod => {
            currentScope = mod.meta.scope;
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            assert(currentScope.parent);
            currentScope = currentScope.parent;
            return modᐟ;
        },

        // Resolve import expressions.
        ImportExpression: imp => {
            // TODO: temp special-case 'std' and 'experiments' handling. Unify these three cases better...
            if (imp.moduleSpecifier === 'std') {
                let impᐟ = {...imp, meta: {scope: STD_SCOPE}};
                return impᐟ;
            }
            else if (imp.moduleSpecifier === 'experiments') {
                let impᐟ = {...imp, meta: {scope: EXPERIMENTS_SCOPE}};
                return impᐟ;
            }
            else {
                let sourceFile = program.sourceFiles.get(imp.sourceFilePath)!;
                let scope = sourceFile.module.meta.scope;
                let impᐟ = {...imp, meta: {scope}};
                return impᐟ;
            }
        },

        // Resolve symbol references.
        ReferenceExpression: ref => {
            let symbol = symbolTable.lookup(ref.name, currentScope);
            let refᐟ = {...ref, meta: {symbolId: symbol.id}};
            return refᐟ;
        },
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === rootScope);

    // All done.
    return result;
}
