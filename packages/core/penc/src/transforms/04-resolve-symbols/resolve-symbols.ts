import {Program, ReferenceExpression, SimpleBinding} from '../../ast-nodes';
import {assert, mapAst, mapMap} from '../../utils';
import {DesugaredNodeKind, ResolvedNodeKind} from '../asts';
import {ScopeSymbol, SymbolTable} from './symbol-table';


// TODO: doc...
export function resolveSymbols(program: Program<DesugaredNodeKind>): Program<ResolvedNodeKind> {
    const symbolTable = new SymbolTable();
    let currentScope: ScopeSymbol | undefined;
    let startSymbolId: string | undefined;
    let allRefs = [] as Array<{scope: ScopeSymbol, ref: ReferenceExpression}>;
    let result = mapAst(program, ResolvedNodeKind, rec => ({

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

        // Attach a symbol to each simple binding, returning a resolved SimpleBinding node.
        // NB: There are no UnresolvedDestructuredBinding nodes after desugaring.
        UnresolvedSimpleBinding: ({name, value, exported}): SimpleBinding<ResolvedNodeKind> => {
            assert(currentScope);
            let symbolId = symbolTable.createName(name, currentScope).id;
            return {kind: 'SimpleBinding', name, value: rec(value), exported, symbolId};
        },

        // Attach a symbol to each reference expression, returning a resolved ReferenceExpression node.
        // Make a list of all the ReferenceExpression nodes, for backpatching the symbolIds after this traversal.
        UnresolvedReferenceExpression: ({name}) => {
            assert(currentScope);
            let ref: ReferenceExpression = {kind: 'ReferenceExpression', name, symbolId: 'badRef'};
            allRefs.push({scope: currentScope, ref});
            return ref;
        },
    }));

    // Every definition now has a symbol.
    // Backpatch all the UnresolvedReferenceExpression nodes with the symbol they refer to.
    for (let {scope, ref} of allRefs) {
        let symbolId = symbolTable.lookupName(ref.name, scope).id;
        Object.assign(ref, {symbolId});
    }

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}
