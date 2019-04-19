import {matchNode, Module, Node, nodeKinds} from './ast';




// TODO: temp testing...
let ast!: Module;
const x = rewriteAst(ast, {
    Definition: {
        leave: def => ({...def, stuff: 42 as const}),
    },
});
if (x.kind === 'PenModule') {
    let x1 = x.declarations[0];
    if (x1.kind === 'Definition') {
        x1.stuff;
    }
    else {
        //x1.stuff;
    }
}


// STEP BACK: what do we need this for?
// - pass 1:
//   - track scopes as we enter and leave nodes (don't need to change the nodes)
//   - augment Definition nodes with a link to their symbol table entry
//     (can be done either top-down or bottom-up)
//     (produces a subtype of Definition, also any type that holds a Definition must also be subtyped, and so on recursively)
// - pass 2:
//   - augment Reference nodes with a link to the symbol they reference
//     (can be done either top-down or bottom-up)
//     (produces a subtype of Reference, also any type that holds a Definition must also be subtyped, and so on recursively)




// TODO: jsdoc...
// doc... nodes are replaced by their transform function result, both top-down and bottom-up
export function rewriteAst<X extends Transforms>(ast: Module, transforms: X) {

    // TODO: doc...
    let normal = nodeKinds.reduce(
        (xforms, kind) => Object.assign(xforms, {[kind]: {...UNTRANSFORMED, ...transforms[kind]}}),
        {} as NormalisedTransforms,
    );

    // TODO: doc...
    // TODO: the type is wrong... should be...
    // 1. start with the union of all Node types (ie the `Node` type)
    // 2. distribute over union (1) to get the union of top-down transformed types
    
    // 3. recursive type step... call self somehow...

    // 4. distribute over union from (3) to get the union of bottom-up transformed types
    // 5. that's the new AST shape



    // 2. recurse to the children of the type from (1)



    var result: DeepTransform<DeepTransform<Module, TopDownTransforms<X>>, BottomUpTransforms<X>>;
    result = rewriteNode(ast, normal) as any;
    return result;
}




// TODO: jsdoc...
export type Transforms = {
    [K in NodeKinds]?: {
        enter?: (n: NodeFromKind<K>) => Node;
        leave?: (n: NodeFromKind<K>) => Node;
    }
};




type DeepTransform<N, X extends {[K in NodeKinds]: Node}> =
    N extends Node ? DeepTransformNode<X[N['kind']], X> :
    N;

type DeepTransformNode<N extends Node, X extends {[K in NodeKinds]: Node}> = {
    [K in keyof N]:
        N[K] extends Array<infer E1> ? Array<DeepTransform<E1, X>> :
        N[K] extends ReadonlyArray<infer E1> ? ReadonlyArray<DeepTransform<E1, X>> :
        DeepTransform<N[K], X>;
};

type TopDownTransforms<X extends Transforms> = {
    [K in NodeKinds]: X[K] extends {enter: {}} ? ReturnType<X[K]['enter']> : NodeFromKind<K>
};

type BottomUpTransforms<X extends Transforms> = {
    [K in NodeKinds]: X[K] extends {leave: {}} ? ReturnType<X[K]['leave']> : NodeFromKind<K>
};




// TODO: totes internal stuff...
const UNTRANSFORMED = {enter: (n: Node) => n, leave: (n: Node) => n} as {enter: any, leave: any};

type NormalisedTransforms = {
    [K in NodeKinds]: {
        enter: (n: Node) => Node;
        leave: (n: Node) => Node;
    }
};




// Helper type that maps a node kind `K` to its corresponding node type.
type NodeFromKind<K extends NodeKinds, N = Node> = N extends {kind: K} ? N : never;
type NodeKinds = Node['kind'];




// TODO: temp testing...
function rewriteNode(node: Node, transforms: NormalisedTransforms): Node {

    // apply the top-down transform to the node.
    node = transforms[node.kind].enter(node);

    // recursively rewrite the child nodes.
    let trans = (n: Node) => rewriteNode(n, transforms)
    node = matchNode<unknown>(node, {
        Application: n => ({...n, combinator: trans(n.combinator), arguments: n.arguments.map(trans)}),
        Block: n => ({...n, definitions: n.definitions.map(trans)}),
        CharacterRange: n => n,
        Combinator: n => ({...n, expression: trans(n.expression)}),
        Definition: n => ({...n, expression: trans(n.expression)}),
        ForeignModule: n => n,
        ImportDeclaration: n => n,
        ListLiteral: n => ({...n, elements: n.elements.map(trans)}),
        Parenthetical: n => ({...n, expression: trans(n.expression)}),
        PenModule: n => ({...n, declarations: n.declarations.map(trans)}),
        RecordField: n => ({...n, name: n.hasComputedName ? trans(n.name) : n.name, expression: trans(n.expression)}),
        RecordLiteral: n => ({...n, fields: n.fields.map(trans)}),
        Reference: n => n,
        Selection: n => ({...n, exprssions: n.expressions.map(trans)}),
        Sequence: n => ({...n, exprssions: n.expressions.map(trans)}),
        StringLiteral: n => n,
        VoidLiteral: n => n,
    }) as Node;

    // apply the bottom-up transform to the node.
    node = transforms[node.kind].leave(node);

    // All done. Return the rewritten node.
    return node;
}
