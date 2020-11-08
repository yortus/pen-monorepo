// import {traverseNode} from '../../abstract-syntax-trees';
// import {ResolvedProgram} from '../../representations';


// // TODO: jsdoc...
// export function checkSemantics(program: ResolvedProgram) {
//     traverseNode(program.sourceFiles, n => {
//         switch (n.kind) {
//             case 'RecordExpression': {
//                 // Ensure Record field names are unique within the record definition
//                 const names = new Set<string>();
//                 for (const field of n.fields) {
//                     if (names.has(field.name)) throw new Error(`Duplicate field name '${field.name}'`);
//                     names.add(field.name);
//                 }
//             }
//         }
//     });
// }
