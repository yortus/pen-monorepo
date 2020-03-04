import {Node, Program} from '../../ast-nodes';
import {Scope} from '../../scope';
import {SymbolTable} from '../../symbol-table';
import {assert, makeNodeMapper, mapMap} from '../../utils';
import {SymbolDefinitions} from './symbol-definitions';


// TODO: doc...
export function createSymbolDefinitions(program: Program) {
    const symbolTable = new SymbolTable();
    let currentScope: Scope | undefined;
    let mapNode = makeNodeMapper<Node, Node<SymbolDefinitions>>();
    let result = mapNode(program, rec => ({

        // Attach the symbol table to the Program node.
        Program: prg => {
            let prgᐟ = {...prg, sourceFiles: mapMap(prg.sourceFiles, rec), meta: {symbolTable}};
            return prgᐟ;
        },

        // Attach a scope to each Module node.
        Module: mod => {
            let scope = currentScope = {parent: currentScope, symbols: new Map()};
            let modᐟ = {...mod, bindings: mod.bindings.map(rec), meta: {scope}};
            currentScope = scope.parent;
            return modᐟ;
        },

        // Attach a symbol to each VariablePattern and ModulePatternName node.
        VariablePattern: pat => {
            assert(currentScope !== undefined);
            let symbol = symbolTable.create(pat.name, currentScope);
            let patternᐟ = {...pat, meta: {symbolId: symbol.id}};
            return patternᐟ;
        },
        ModulePatternName: name => {
            assert(currentScope !== undefined);
            let symbol = symbolTable.create(name.alias || name.name, currentScope);
            let nameᐟ = {...name, meta: {symbolId: symbol.id}};
            return nameᐟ;
        },
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}
