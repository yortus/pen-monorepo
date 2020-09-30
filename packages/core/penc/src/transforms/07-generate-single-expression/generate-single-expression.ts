// // TODO: raise an error for unreferenced non-exported bindings. Need to impl exports properly first...


// import {createDereferencer, createNodeHasher, traverseNode} from '../../abstract-syntax-trees';
// import type {Expression, GlobalBinding, GlobalReferenceExpression} from '../../abstract-syntax-trees';
// import {resolvedNodeKinds, ResolvedProgram, SingleExpressionProgram} from '../../representations';
// import {assert} from '../../utils';


// // TODO: jsdoc...
// // - result omits all unreferenced expressions
// // - result dedupes semantically equivalent expressions
// export function generateSingleExpression(program: ResolvedProgram): SingleExpressionProgram {

//     // ENTRY rules:
//     // a. the expression in an ENTRY is always 'flat' - any subexpressions are ReferenceExpressions to other ENTRYs
//     // b. each ENTRY has a unique name (to facilitate rule (a)). Can be human-readable / linked to source names
//     // c. ENTRY expressions are never ReferenceExpressions - these are always resolved before creating entries
//     // d. ENTRY expressions *may be* MemberExpressions, if they cannot be resolved

//     // Make a flat list of every GlobalBinding in the entire program.
//     const allBindings = [] as GlobalBinding[];
//     traverseNode(program.sourceFiles, n => n.kind === 'GlobalBinding' ? allBindings.push(n) : 0);

//     // Create helper functions for this program.
//     let deref = createDereferencer(program.sourceFiles);
//     let getHashFor = createNodeHasher(deref);

//     // Find the `start` expression.
//     let startExpr = allBindings.find(n => n.globalName === program.startGlobalName)?.value;
//     assert(startExpr);

//     // Populate the `entriesByHash` map.
//     let entriesByHash = new Map<string, Entry>();
//     let startEntry = getEntryFor(startExpr); // NB: called for side-effect of populating `entriesByHash` map.

//     // TODO: Fill in the expression names using the binding names from bindings with the same hash value...
//     let namesByHash = new Map<string, string>();
//     for (let binding of allBindings) {
//         // TODO: skip if already named? this impl will overwrite earlier names with later ones. See how output looks...
//         assert(resolvedNodeKinds.includes(binding.value));
//         namesByHash.set(getHashFor(binding.value), binding.globalName);
//     }

//     // TODO: fill in all other names using generated names
//     // TODO: ensure generated names can't clash with any other global names
//     let counter = 0;
//     for (let hash of entriesByHash.keys()) {
//         if (namesByHash.has(hash)) continue;
//         namesByHash.set(hash, `e${++counter}`); // TODO: can't currently clash with a `scope_local` style name,
//             // but what if naming system changes? Better to have a standard helper that intenally holds a name pool,
//             // and maps suggested names to guaranteed unique names within the pool? Then use it elsewhere where names
//             // are generated too.
//     }

//     // TODO: temp testing... build the single-expression program representation
//     let subexpressions = {} as Record<string, Expression>;
//     for (let {hash, expr} of entriesByHash.values()) {
//         let name = namesByHash.get(hash)!;
//         subexpressions[name] = expr;
//     }

//     // TODO: temp testing... fix up every GlobalReferenceExpression with the proper name
//     for (let {expr} of entriesByHash.values()) {
//         traverseNode(expr, n => {
//             if (n.kind !== 'GlobalReferenceExpression') return;
//             Object.assign(n, {globalName: namesByHash.get(n.globalName)!});
//         });
//     }

//     return {
//         kind: 'SingleExpressionProgram',
//         startName: namesByHash.get(startEntry.hash)!,
//         subexpressions
//     };

//     // TODO: recursive...
//     function getEntryFor(expr: Expression): Entry {
//         assert(resolvedNodeKinds.includes(expr));

//         // TODO: doc...
//         let e = deref(expr);
//         let hash = getHashFor(e);
//         if (entriesByHash.has(hash)) return entriesByHash.get(hash)!;

//         // TODO: doc...
//         let entry: Entry = {hash, expr: undefined!};
//         entriesByHash.set(hash, entry);

//         // Set `entry.expr` to a new shallow expr, and return `entry`.
//         switch (e.kind) {
//             case 'ApplicationExpression': return setX(e, {lambda: ref(e.lambda), argument: ref(e.argument)});
//             case 'BooleanLiteralExpression': return setX(e);
//             case 'ExtensionExpression': return setX(e);
//             case 'FieldExpression': return setX(e, {name: ref(e.name), value: ref(e.value)});
//             case 'ImportExpression': assert(false); // Should never see an ImportExpression here
//             case 'ListExpression': return setX(e, {elements: e.elements.map(ref)});
//             case 'MemberExpression': return setX(e, {module: ref(e.module), bindingName: e.bindingName});
//             case 'ModuleExpression': {
//                 let bindings = e.module.bindings.map(binding => ({...binding, value: ref(binding.value)}));
//                 return setX(e, {module: {kind: 'Module', bindings}});
//             }
//             case 'NotExpression': return setX(e, {expression: ref(e.expression)});
//             case 'NullLiteralExpression': return setX(e);
//             case 'NumericLiteralExpression': return setX(e);
//             case 'QuantifiedExpression': return setX(e, {expression: ref(e.expression), quantifier: e.quantifier});
//             case 'RecordExpression': return setX(e, {fields: e.fields.map(f => ({name: f.name, value: ref(f.value)}))});
//             case 'SelectionExpression': return setX(e, {expressions: e.expressions.map(ref)});
//             case 'SequenceExpression': return setX(e, {expressions: e.expressions.map(ref)});
//             case 'StringLiteralExpression': return setX(e);
//             default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(e);
//         }

//         function ref(expr: Expression): GlobalReferenceExpression {
//             // TODO: doc/fix the temporary use of 'hash' here - it gets patched up later (see L64 above)
//             return {kind: 'GlobalReferenceExpression', localName: '', globalName: getEntryFor(expr).hash};
//         }

//         function setX<E extends Expression>(expr: E, vals?: Omit<E, 'kind'>) {
//             entry.expr = Object.assign({kind: expr.kind}, vals || expr) as unknown as Expression;
//             return entry;
//         }
//     }
// }


// interface Entry {
//     hash: string;
//     expr: Expression;
// }
