import {GlobalBinding, GlobalReferenceExpression} from '../../representations';
import {DesugaredProgram, ResolvedNodeKind, ResolvedProgram} from '../../representations';
import {assert, mapAst} from '../../utils';
import {ScopeSymbol, SymbolTable} from './symbol-table';


// TODO: doc...
export function resolveSymbols(program: DesugaredProgram): ResolvedProgram {
    const symbolTable = new SymbolTable();
    let currentScope: ScopeSymbol | undefined;
    let startGlobalName: string | undefined;
    let allRefs = [] as Array<{scope: ScopeSymbol, ref: GlobalReferenceExpression}>;
    let moduleMapᐟ = mapAst(program.sourceFiles, ResolvedNodeKind, rec => ({

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
    return {...program, sourceFiles: moduleMapᐟ, startGlobalName};
}
