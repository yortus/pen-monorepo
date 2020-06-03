import {Node, Program} from '../../ast-nodes';
import {SymbolTable} from '../../symbol-table';
import {assert, makeNodeMapper, mapMap} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function createSymbolDefinitions(program: Program) {
    const symbolTable = new SymbolTable();
    let currentScope = symbolTable.getRootScope();
    let mapNode = makeNodeMapper<Node, Node<Metadata>>();
    let result = mapNode(program, rec => ({

        // Attach the symbol table to the Program node.
        Program: prg => {
            let sourceFiles = mapMap(prg.sourceFiles, rec);
            let main = sourceFiles.get(program.mainPath)!;
            if (main.kind !== 'PenSourceFile') throw new Error(`Main module must be a pen module, not an extension.`);
            let startSymbolId = main.module.meta.scope.sourceNames.get('start')?.id;
            if (startSymbolId === undefined) throw new Error(`Main module must define a 'start' rule.`);
            let prgᐟ = {...prg, sourceFiles, meta: {symbolTable, startSymbolId}};
            return prgᐟ;
        },

        // Attach a scope to each Module node.
        Module: mod => {
            let scope = currentScope = symbolTable.createChildScope(currentScope, 'Module');
            let modᐟ = {...mod, bindings: mod.bindings.map(rec), meta: {scope}};
            currentScope = scope.scope;
            return modᐟ;
        },

        // Attach a scope to each ExtensionFile node, and define a symbol for each of its exports.
        ExtensionFile: ext => {
            let scope = currentScope = symbolTable.createChildScope(currentScope, 'Extension');
            ext.exportedNames.forEach(name => symbolTable.create(name, scope));
            let extᐟ = {...ext, meta: {scope}};
            currentScope = scope.scope;
            return extᐟ;
        },

        // Attach a symbol to each VariablePattern and ModulePatternName node.
        VariablePattern: pat => {
            let symbol = symbolTable.create(pat.name, currentScope);
            let patternᐟ = {...pat, meta: {symbolId: symbol.id}};
            return patternᐟ;
        },
        ModulePatternName: name => {
            let symbol = symbolTable.create(name.alias || name.name, currentScope);
            let nameᐟ = {...name, meta: {symbolId: symbol.id}};
            return nameᐟ;
        },
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === symbolTable.getRootScope());

    // All done.
    return result;
}
