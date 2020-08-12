import {ReferenceExpression} from '../../ast-nodes';
import {assert, makeNodeMapper, mapMap} from '../../utils';
import {DesugaredNodes, DesugaredProgram, ResolvedNodes, ResolvedProgram} from '../asts';
import {ScopeSymbol, SymbolTable} from './symbol-table';


// TODO: doc...
export function resolveSymbols(program: DesugaredProgram): ResolvedProgram {
    const symbolTable = new SymbolTable();
    let currentScope: ScopeSymbol | undefined;
    let startSymbolId: string | undefined;
    let allRefs = [] as Array<{scope: ScopeSymbol, ref: ReferenceExpression}>;
    let mapNode = makeNodeMapper<DesugaredNodes, ResolvedNodes>();
    let result = mapNode(program, rec => ({

        // Attach the symbol table to the Program node.
        Program: prg => {
            let sourceFiles = mapMap(prg.sourceFiles, rec);
            let prgᐟ = {...prg, sourceFiles, startSymbolId};
            return prgᐟ;
        },

        // Attach a scope to each Module node.
        Module: mod => {
            let outerScope = currentScope;
            currentScope = symbolTable.createScope(currentScope);
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            if (mod.path === program.mainPath) {
                // This is the main module. Assign to startSymbolId.
                startSymbolId = currentScope.sourceNames.get('start')?.id;
                if (startSymbolId === undefined) throw new Error(`Main module must define a 'start' rule.`);
            }
            currentScope = outerScope;
            return modᐟ;
        },

        // Attach a symbol to each SimpleBinding node. NB: There are no DestructuredBinding nodes after desugaring.
        SimpleBinding: bnd => {
            assert(currentScope);
            let symbolId = symbolTable.createName(bnd.name, currentScope).id;
            let bndᐟ = {...bnd, value: rec(bnd.value), symbolId};
            return bndᐟ;
        },

        // Make a list of all the ReferenceExpression nodes, for backpatching after this traversal.
        ReferenceExpression: ref => {
            assert(currentScope);
            let refᐟ = {...ref};
            allRefs.push({scope: currentScope, ref: refᐟ});
            return refᐟ;
        },
    }));

    // Every definition now has a symbol. Backpatch all the ReferenceExpression nodes with the symbol they refer to.
    for (let {scope, ref} of allRefs) {
        let symbolId = symbolTable.lookupName(ref.name, scope).id;
        Object.assign(ref, {symbolId});
    }

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}
