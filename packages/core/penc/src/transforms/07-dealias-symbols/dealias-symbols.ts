// import {Expression, Node, Program} from '../../ast-nodes';
// import {assert, makeNodeMapper, makeNodeVisitor} from '../../utils';
// import {Metadata} from './metadata';


// // TODO: doc...
// export function dealiasSymbols(program: Program<Metadata>) {
//     let aliases = collectAliases(program);

//     // TODO: doc... process aliases:
//     // - self-aliases (throw an error)
//     // - transitive aliases (eg 13-->2, 2-->33 in json.pen)
//     while (true) {
//         let modified = false;
//         for (let [fromSymbolId, toSymbolId] of aliases.entries()) {
//             if (fromSymbolId === toSymbolId) {
//                 let symbol = program.meta.symbolTable.getSymbolById(fromSymbolId);
//                 assert(symbol.kind === 'NameSymbol');
//                 throw new Error(`Symbol '${symbol.sourceName}' is defined as itself.`);
//             }
//             if (aliases.has(toSymbolId)) {
//                 aliases.set(fromSymbolId, aliases.get(toSymbolId)!);
//                 modified = true;
//             }
//         }
//         if (!modified) break;
//     }

//     // TODO: doc... forall nodes with symbolId, replace meta.symbolId with alias target (if any)
//     let mapNode = makeNodeMapper<Node<Metadata>, Node<Metadata>>();
//     let result = mapNode(program, _rec => ({
//         VariablePattern: pat => {
//             let symbolId = aliases.get(pat.meta.symbolId) ?? pat.meta.symbolId;
//             let patᐟ = {...pat, meta: {symbolId}};
//             return patᐟ;
//         },
//         ModulePatternName: pat => {
//             let symbolId = aliases.get(pat.meta.symbolId) ?? pat.meta.symbolId;
//             let patᐟ = {...pat, meta: {symbolId}};
//             return patᐟ;
//         },
//         ReferenceExpression: ref => {
//             let symbolId = aliases.get(ref.meta.symbolId) ?? ref.meta.symbolId;
//             let refᐟ = {...ref, meta: {symbolId}};
//             return refᐟ;
//         },
//     }));

//     // All done.
//     return result;
// }


// // TODO: doc...
// function collectAliases(program: Program<Metadata>): Map<string, string> {
//     let aliases = new Map<string, string>(); // maps from symbolId -> symbolId
//     let visitNode = makeNodeVisitor<Node<Metadata>>();
//     visitNode(program, rec => ({
//         Module: module => {
//             for (let {pattern, value} of module.bindings) {
//                 if (pattern.kind === 'ModulePattern' && pattern.names.length > 0) {
//                     // Each ModulePatternName *must* be an alias to a name in the rhs module
//                     for (let {meta: {symbolId: fromSymbolId}} of pattern.names) {
//                         let toSymbolId: string;
//                         if (value.kind === 'ImportExpression') {
//                             toSymbolId = value.meta.scope.id;
//                         }
//                         else if (value.kind === 'ModuleExpression') {
//                             toSymbolId = value.module.meta.scope.id;
//                         }
//                         else if (value.kind === 'ReferenceExpression') {
//                             toSymbolId = value.meta.symbolId;
//                         }
//                         // BUG: BindingLookupExpression belongs here too... or does it??
//                         else {
//                             // TODO: tidy up / check logic...
//                             throw new Error(`Internal error: should never get here`);
//                         }
//                         aliases.set(fromSymbolId, toSymbolId);
//                     }
//                 }
//                 else if (pattern.kind === 'VariablePattern' && isLValue(value)) {
//                     let fromSymbolId = pattern.meta.symbolId;
//                     let toSymbolId: string;
//                     if (value.kind === 'ImportExpression') {
//                         toSymbolId = value.meta.scope.id;
//                     }
//                     else if (value.kind === 'ModuleExpression') {
//                         toSymbolId = value.module.meta.scope.id;
//                     }
//                     else if (value.kind === 'ReferenceExpression') {
//                         toSymbolId = value.meta.symbolId;
//                     }
//                     // BUG: BindingLookupExpression belongs here too... or does it??
//                     else {
//                         // TODO: tidy up / check logic...
//                         throw new Error(`Internal error: should never get here`);
//                     }
//                     aliases.set(fromSymbolId, toSymbolId);
//                 }
//             }
//             module.bindings.forEach(rec);
//         },
//     }));
//     return aliases;
// }


// // TODO: doc...


// // TODO: helper function
// function isLValue(e: Expression): e is Expression & {kind: 'ImportExpression' | 'ModuleExpression' | 'ReferenceExpression'} {
//     // BUG: BindingLookupExpression belongs here too...
//     // TODO: ^^^
//     return e.kind === 'ImportExpression' || e.kind === 'ModuleExpression' || e.kind === 'ReferenceExpression';
// }
