import {GlobalBinding, GlobalReferenceExpression, Program} from '../../ast-nodes';
import {assert, mapAst, mapMap} from '../../utils';
import {DesugaredNodeKind, ResolvedNodeKind} from '../asts';
import {ScopeSymbol, SymbolTable} from './symbol-table';


// TODO: doc...
export function resolveSymbols(program: Program<DesugaredNodeKind>): Program<ResolvedNodeKind> {
    const symbolTable = new SymbolTable();
    let currentScope: ScopeSymbol | undefined;
    let startSymbolId: string | undefined;
    let allRefs = [] as Array<{scope: ScopeSymbol, ref: GlobalReferenceExpression}>;
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

        // Attach a unique name to each local binding, returning a GlobalBinding node.
        LocalBinding: ({localName, value, exported}): GlobalBinding<ResolvedNodeKind> => {
            assert(currentScope);
            let globalName = symbolTable.createName(localName, currentScope).id;
            return {kind: 'GlobalBinding', localName, globalName, value: rec(value), exported};
        },

        // Convert each LocalReferenceExpression to a GlobalReferenceExpression.
        // Make a list of all the GlobalReferenceExpression nodes, for backpatching the names after this traversal.
        LocalReferenceExpression: ({localName}) => {
            assert(currentScope);
            let ref: GlobalReferenceExpression = {kind: 'GlobalReferenceExpression', localName, globalName: ''};
            allRefs.push({scope: currentScope, ref});
            return ref;
        },
    }));

    // Every binding now has a unique name.
    // Backpatch all the GlobalReferenceExpression nodes with its corresponding unique name.
    for (let {scope, ref} of allRefs) {
        let globalName = symbolTable.lookupName(ref.localName, scope).id;
        Object.assign(ref, {globalName});
    }

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}
