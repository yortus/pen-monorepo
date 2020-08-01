import {Node, Program, ReferenceExpression} from '../../ast-nodes';
import {ScopeSymbol, SymbolTable} from '../../symbol-table';
import {assert, makeNodeMapper, mapMap} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function resolveSymbols(program: Program) {
    const symbolTable = new SymbolTable();
    let currentScope: ScopeSymbol | undefined;
    let startSymbolId: string;
    let allRefs = [] as Array<{scope: ScopeSymbol, ref: ReferenceExpression<Metadata>}>;
    let mapNode = makeNodeMapper<Node, Node<Metadata>>();
    let result = mapNode(program, rec => ({

        // Attach the symbol table to the Program node.
        Program: prg => {
            let sourceFiles = mapMap(prg.sourceFiles, rec);
            let prgᐟ = {...prg, sourceFiles, meta: {symbolTable, startSymbolId}};
            return prgᐟ;
        },

        // Attach a scope to each Module node.
        Module: mod => {
            let outerScope = currentScope;
            currentScope = symbolTable.createScope(currentScope);
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            if (mod.path === program.mainPath) {
                // This is the main module. Assign to startSymbolId.
                startSymbolId = currentScope.sourceNames.get('start')?.id!;
                if (startSymbolId === undefined) throw new Error(`Main module must define a 'start' rule.`);
            }
            currentScope = outerScope;
            return modᐟ;
        },

        // Attach a symbol to each SimpleBinding node. NB: There are no DestructuredBinding nodes after desugaring.
        SimpleBinding: bnd => {
            assert(currentScope);
            let symbol = symbolTable.createName(bnd.name, currentScope);
            let bndᐟ = {...bnd, value: rec(bnd.value), meta: {symbolId: symbol.id}};
            return bndᐟ;
        },

        // Make a list of all the ReferenceExpression nodes, for backpatching after this traversal.
        ReferenceExpression: ref => {
            assert(currentScope);
            let refᐟ = {...ref, meta: {symbolId: '---'}}; // TODO: use proper 'badRef' symbolId here
            allRefs.push({scope: currentScope, ref: refᐟ});
            return refᐟ;
        },
    }));

    // Every definition now has a symbol. Backpatch all the ReferenceExpression nodes with the symbol they refer to.
    for (let {scope, ref} of allRefs) {
        let symbol = symbolTable.lookupName(ref.name, scope);
        Object.assign(ref.meta, {symbolId: symbol.id});
    }

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}
