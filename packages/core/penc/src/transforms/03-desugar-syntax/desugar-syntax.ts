// import {createNodeMapper, LocalBinding, LocalReferenceExpression, MemberExpression} from '../../abstract-syntax-trees';
// import {desugaredNodeKinds, DesugaredProgram, sourceNodeKinds, SourceProgram} from '../../representations';
// import {assert} from '../../utils';


// // TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// // - LocalMultiBinding
// export function desugarSyntax(program: SourceProgram): DesugaredProgram {
//     let counter = 0;
//     const mapNode = createNodeMapper(sourceNodeKinds, desugaredNodeKinds);
//     const sourceFiles = mapNode(program.sourceFiles, rec => ({

//         // Replace each LocalMultiBinding with a series of LocalBindings
//         Module: mod => {
//             const bindings = [] as LocalBinding[];
//             for (const binding of mod.bindings) {
//                 assert(sourceNodeKinds.includes(binding));
//                 if (binding.kind === 'LocalBinding') {
//                     bindings.push(rec(binding));
//                 }
//                 else {
//                     // Introduce a new local binding for the RHS.
//                     // TODO: ensure no collisions with program names. '$1' etc is ok since '$' isn't allowed in PEN ids.
//                     const localName = `$${++counter}`;
//                     const {names, value, exported} = binding;
//                     bindings.push({
//                         kind: 'LocalBinding',
//                         localName,
//                         value: rec(value),
//                         exported
//                     });

//                     // Introduce a local binding for each name in the LHS
//                     for (const {name: member, alias} of names) {
//                         let ref: LocalReferenceExpression;
//                         let mem: MemberExpression;
//                         ref = {kind: 'LocalReferenceExpression', localName};
//                         mem = {kind: 'MemberExpression', module: ref, member};
//                         bindings.push({
//                             kind: 'LocalBinding',
//                             localName: alias ?? member,
//                             value: mem,
//                             exported
//                         });
//                     }
//                 }
//             }

//             const modᐟ = {...mod, bindings};
//             return modᐟ;
//         },

//         // This is handled within the 'Module' callback, but must be present since it's in Source but not Desugared
//         LocalMultiBinding: 'default',
//     }));

//     return {
//         kind: 'DesugaredProgram',
//         sourceFiles,
//         mainPath: program.mainPath
//     };
// }
