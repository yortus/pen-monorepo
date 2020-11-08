// import {createNodeMapper, GlobalBinding, GlobalReferenceExpression} from '../../abstract-syntax-trees';
// import {desugaredNodeKinds, DesugaredProgram, resolvedNodeKinds, ResolvedProgram} from '../../representations';
// import {assert} from '../../utils';
// import {ScopeSymbol, SymbolTable} from './symbol-table';


// // TODO: jsdoc...
// export function resolveSymbols(program: DesugaredProgram): ResolvedProgram {
//     const symbolTable = new SymbolTable();
//     let currentScope: ScopeSymbol | undefined;
//     let startGlobalName: string | undefined;
//     const allRefs = [] as Array<{scope: ScopeSymbol, ref: GlobalReferenceExpression}>;
//     const mapNode = createNodeMapper(desugaredNodeKinds, resolvedNodeKinds);
//     const sourceFiles = mapNode(program.sourceFiles, rec => ({

//         // Attach a scope to each Module node.
//         Module: mod => {
//             const outerScope = currentScope;
//             currentScope = symbolTable.createScope(currentScope, mod.path);
//             const modᐟ = {...mod, bindings: mod.bindings.map(rec)};
//             if (mod.path === program.mainPath) {
//                 // This is the main module. Assign to startGlobalName.
//                 startGlobalName = currentScope.localNames.get('start')?.globalName;
//             }
//             currentScope = outerScope;
//             return modᐟ;
//         },

//         // Attach a unique name to each local binding, returning a GlobalBinding node.
//         LocalBinding: ({localName, value, exported}): GlobalBinding => {
//             assert(currentScope);
//             const {globalName} = symbolTable.createName(localName, currentScope);
//             return {kind: 'GlobalBinding', localName, globalName, value: rec(value), exported};
//         },

//         // Convert each LocalReferenceExpression to a GlobalReferenceExpression.
//         // Make a list of all the GlobalReferenceExpression nodes, for backpatching the names after this traversal.
//         LocalReferenceExpression: ({localName}) => {
//             assert(currentScope);
//             let ref: GlobalReferenceExpression;
//             ref = {kind: 'GlobalReferenceExpression', localName, globalName: ''};
//             allRefs.push({scope: currentScope, ref});
//             return ref;
//         },
//     }));

//     // Every binding now has a unique name.
//     // Backpatch all the GlobalReferenceExpression nodes with its corresponding unique name.
//     for (const {scope, ref} of allRefs) {
//         const {globalName} = symbolTable.lookupName(ref.localName, scope);
//         Object.assign(ref, {globalName});
//     }

//     // sanity check - we should be back to the scope we started with here.
//     assert(currentScope === undefined);

//     // Ensure a start rule was found in the program
//     if (!startGlobalName) throw new Error(`Main module must define a 'start' rule.`);

//     // All done.
//     return {
//         kind: 'ResolvedProgram',
//         sourceFiles,
//         mainPath: program.mainPath, startGlobalName
//     };
// }
