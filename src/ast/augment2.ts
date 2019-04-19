// TODO: this whole file temp testing...
import {matchNode} from './match-node';
import {nodeKinds} from './node-kinds';
import {Node} from './node-types';




// let ast2!: Node;
// let r1 = augment(ast2, {
//     Block: (n) => ({...n, extra: 'block' as const}),
//     Definition: (n, visitChildren) => ({...visitChildren(n), extra: 42 as const}),
// });
// if (r1.kind === 'PenModule') {
//     let decl = r1.declarations[0];
//     if (decl.kind === 'Definition') {
//         let def = decl;
//         def.name;
//         def.extra;
//         let expr = def.expression;
//         if (expr.kind === 'Block') {
//             let blk = expr;
//             blk.extra; // 'block'
//             blk.definitions[0].extra; // 42
//         }
//     }
//     else {
//         decl.bindings;
//     }
// }




export function augment<V extends Visitors>(ast: Node, visitors: V) {
    const traverse = makeTraverser(visitors);
    let result = traverse(ast) as unknown as Augment<Node, Mapping<V>>;
    return result;
}




type Visitors = {[K in NodeKinds]?: VisitNode<NodeFromKind<K>>};
type VisitNode<N extends Node> = (n: N, visitChildren: (n: N) => N) => N;




type NodeFromKind<K extends NodeKinds, N = Node> = N extends {kind: K} ? N : never;
type NodeKinds = Node['kind'];




type Mapping<V extends Visitors> = {[K in NodeKinds]: V[K] extends VisitNode<any> ? ReturnType<V[K]> : NodeFromKind<K>};




type Augment<T, Mapping extends {[K in NodeKinds]: NodeFromKind<K>}> =
    // If T is a node type, produce the augmented node type.
    // If T is a union of node types, produce the union of augmented node types.
    T extends Node ? AugmentDeep<Mapping[T['kind']], Mapping> :
    // For any other N, leave it unchanged
    T;

// doc... N is a single node type. Map over its properties, augmenting them recursively.
type AugmentDeep<N extends Node, Mapping extends {[K in NodeKinds]: NodeFromKind<K>}> = {
    [K in keyof N]:
        N[K] extends Array<infer E1> ? Array<Augment<E1, Mapping>> :
        N[K] extends ReadonlyArray<infer E1> ? ReadonlyArray<Augment<E1, Mapping>> :
        Augment<N[K], Mapping>;
};




// TODO: temp testing...
function makeTraverser(visitors: Visitors) {
    let allVisitors = nodeKinds.reduce(
        (vs, kind) => Object.assign(vs, {[kind]: visitors[kind] || NO_TRANSFORM}),
        {} as Required<Visitors>,
    );
    const visit = (node: Node) => (allVisitors[node.kind] as VisitNode<Node>)(node, visitChildren);
    const visitChildren = (n: Node): Node => matchNode<unknown>(n, {
        Application: n => ({...n, combinator: visit(n.combinator), arguments: n.arguments.map(visit)}),
        Block: n => ({...n, definitions: n.definitions.map(visit)}),
        CharacterRange: n => n,
        Combinator: n => ({...n, expression: visit(n.expression)}),
        Definition: n => ({...n, expression: visit(n.expression)}),
        ForeignModule: n => n,
        ImportDeclaration: n => n,
        ListLiteral: n => ({...n, elements: n.elements.map(visit)}),
        Parenthetical: n => ({...n, expression: visit(n.expression)}),
        PenModule: n => ({...n, declarations: n.declarations.map(visit)}),
        RecordField: n => ({...n, name: n.hasComputedName ? visit(n.name) : n.name, expression: visit(n.expression)}),
        RecordLiteral: n => ({...n, fields: n.fields.map(visit)}),
        Reference: n => n,
        Selection: n => ({...n, exprssions: n.expressions.map(visit)}),
        Sequence: n => ({...n, exprssions: n.expressions.map(visit)}),
        StringLiteral: n => n,
        VoidLiteral: n => n,
    }) as Node;
    return visit;
}
const NO_TRANSFORM: VisitNode<any> = (n, visitChildren) => visitChildren(n);
