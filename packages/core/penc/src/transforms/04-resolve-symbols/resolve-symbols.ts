import {DesugaredProgram, NodeFromAst, ResolvedProgram} from '../../representations';
import {assert, createAstMapper} from '../../utils';
import {ScopeSymbol, SymbolTable} from './symbol-table';


// TODO: doc...
export function resolveSymbols(program: DesugaredProgram): ResolvedProgram {
    const symbolTable = new SymbolTable();
    let currentScope: ScopeSymbol | undefined;
    let startGlobalName: string | undefined;
    let allRefs = [] as Array<{scope: ScopeSymbol, ref: NodeFromAst<ResolvedProgram, 'GlobalReferenceExpression'>}>;
    let mapAst = createAstMapper<DesugaredProgram, ResolvedProgram>();
    let moduleMapᐟ = mapAst(program.sourceFiles, rec => ({

        // Attach a scope to each Module node.
        Module: mod => {
            let outerScope = currentScope;
            currentScope = symbolTable.createScope(currentScope);
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            if (mod.path === program.mainPath) {
                // This is the main module. Assign to startGlobalName.
                startGlobalName = currentScope.sourceNames.get('start')?.id;
                if (startGlobalName === undefined) throw new Error(`Main module must define a 'start' rule.`);
            }
            currentScope = outerScope;
            return modᐟ;
        },

        // Attach a unique name to each local binding, returning a GlobalBinding node.
        LocalBinding: ({localName, value, exported}): NodeFromAst<ResolvedProgram, 'GlobalBinding'> => {
            assert(currentScope);
            let globalName = symbolTable.createName(localName, currentScope).id;
            return {kind: 'GlobalBinding', localName, globalName, value: rec(value), exported};
        },

        // Convert each LocalReferenceExpression to a GlobalReferenceExpression.
        // Make a list of all the GlobalReferenceExpression nodes, for backpatching the names after this traversal.
        LocalReferenceExpression: ({localName}) => {
            assert(currentScope);
            let ref: NodeFromAst<ResolvedProgram, 'GlobalReferenceExpression'>;
            ref = {kind: 'GlobalReferenceExpression', localName, globalName: ''};
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
    return {
        sourceFiles: moduleMapᐟ,
        mainPath: program.mainPath,
        startGlobalName: startGlobalName,
    };
}
