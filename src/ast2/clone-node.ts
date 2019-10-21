// import {AstVersion, NodeFromKind, NodeKind} from './type-operators';


// export function cloneNode<V extends AstVersion, K extends NodeKind>(node: NodeFromKind<V, K>): NodeFromKind<V, K> {

// }


// export function clone100<K extends NodeKind>(node: NodeFromKind<100, K>): NodeFromKind<100, K> {
//     return (cloners100[node.kind]as any)(node);
// }


// const cloners100: {[K in NodeKind]: (node: NodeFromKind<100, K>) => NodeFromKind<100, K>} = {
//     Application: n => ({...n, function: clone100(n.function), arguments: n.arguments.map(clone100)}),
//     Block: n => ({...n, definitions: n.definitions.map(clone100)}),
//     CharacterRange: n => n,
//     Definition: n => ({...n, expression: clone100(n.expression)}),
//     Function: n => ({...n, expression: clone100(n.expression)}),
//     ImportNames: n => n,
//     ImportNamespace: n => n,
//     ListLiteral: n => ({...n, elements: n.elements.map(clone100)}),
//     ModuleDefinition: n => ({...n, imports: n.imports.map(clone100), block: clone100(n.block)}),
//     Parenthetical: n => ({...n, expression: clone100(n.expression)}),
//     RecordField: n => ({
//         ...n,
//         name: n.hasComputedName ? clone100(n.name) : n.name as any,
//         expression: clone100(n.expression),
//     }),
//     RecordLiteral: n => ({...n, fields: n.fields.map(clone100)}),
//     Reference: n => n,
//     Selection: n => ({...n, expressions: n.expressions.map(clone100)}),
//     Sequence: n => ({...n, expressions: n.expressions.map(clone100)}),
//     StringLiteral: n => n,
//     VoidLiteral: n => n,
// };
