import {Node, Program} from '../../ast-nodes';
import {ScopeSymbol, SymbolTable} from '../../symbol-table';
import {assert, makeNodeMapper, mapMap} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function createSymbolDefinitions(program: Program) {
    const symbolTable = new SymbolTable();
    let currentScope: ScopeSymbol | undefined;
    let mapNode = makeNodeMapper<Node, Node<Metadata>>();
    let result = mapNode(program, rec => ({

        // Attach the symbol table to the Program node.
        Program: prg => {
            let sourceFiles = mapMap(prg.sourceFiles, rec);
            let prgᐟ = {...prg, sourceFiles, meta: {symbolTable}};
            return prgᐟ;
        },

        // Attach a scope to each Module node.
        Module: mod => {
            let outerScope = currentScope;
            let scope = currentScope = symbolTable.createScope(currentScope);
            let modᐟ = {...mod, bindings: mod.bindings.map(rec), meta: {scope}};
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
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}
