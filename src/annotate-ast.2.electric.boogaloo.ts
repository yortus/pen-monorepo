import {matchNode, Module, Node} from './ast';


let ast!: Module;
const x0 = transformAst(ast, {
    Block: n => ({...n, scope: '$SCOPE' as const}),
    Definition: n => ({...n, symbol: '$SYMBOL' as const}),
});
if (x0.kind === 'PenModule') {
    let x1 = x0.declarations[0];
    if (x1.kind === 'Definition') {
        let x2 = x1.expression;
        if (x2.kind === 'Application') {
            x2.kind;
        }
        else if (x2.kind === 'Block') {
            x2.scope;
        }
    }
}





// TODO: jsdoc...
// doc... nodes are replaced by their transform function result
// doc... currently it is a BOTTOM-UP transform
// TODO: also support top-down transform
export function transformAst<X extends {[K in Node['kind']]?: (n: NodeFromKind<K>) => Node}>(ast: Module, xforms: X) {
    let [] = [ast, xforms];
    let result!: DeepAnnotate<Module, X>;
    return result;
}

// Helper type that maps a node kind `K` to its corresponding node type.
type NodeFromKind<K extends Node['kind'], N = Node> = N extends {kind: K} ? N : never;

// TODO: jsdoc...
export type DeepAnnotate<N, X extends {[K in Node['kind']]?: (n: NodeFromKind<K>) => Node}> =
    N extends Node ? DeepAnnotateProps<X[N['kind']] extends (...args: any[]) => infer R ? R : N, X> :
    N;

// TODO: jsdoc...
type DeepAnnotateProps<O, X extends {[K in Node['kind']]?: (n: NodeFromKind<K>) => Node}> = {
    [K in keyof O]:
        O[K] extends Array<infer E1> ? Array<DeepAnnotate<E1, X>> :
        O[K] extends ReadonlyArray<infer E1> ? ReadonlyArray<DeepAnnotate<E1, X>> :
        DeepAnnotate<O[K], X>;
};




// TODO: doc helper function
function transformNode(node: Node, xforms: {[K in Node['kind']]?: (n: NodeFromKind<K>) => Node}) {
    let nodeWithTransformedChildren = transformChildren(node, xforms);
    let xform = xforms[node.kind] as ((n: Node) => Node) | undefined;
    if (!xform) return nodeWithTransformedChildren;
    let transformedNode = xform(nodeWithTransformedChildren);
    return transformedNode;
}




// TODO: doc helper function
function transformChildren(node: Node, xforms: {[K in Node['kind']]?: (n: NodeFromKind<K>) => Node}): Node {
    return matchNode<unknown>(node, {
        Application: n => ({
            ...n,
            combinator: transformNode(n.combinator, xforms),
            arguments: n.arguments.map(arg => transformNode(arg, xforms)),
        }),
        Block: n => ({...n, definitions: n.definitions.map(def => transformNode(def, xforms))}),
        CharacterRange: n => n,
        Combinator: n => ({...n, expression: transformNode(n.expression, xforms)}),
        Definition: n => ({...n, expression: transformNode(n.expression, xforms)}),
        ForeignModule: n => n,
        ImportDeclaration: n => n,
        ListLiteral: n => ({...n, elements: n.elements.map(el => transformNode(el, xforms))}),
        Parenthetical: n => ({...n, expression: transformNode(n.expression, xforms)}),
        PenModule: n => ({...n, declarations: n.declarations.map(decl => transformNode(decl, xforms))}),
        RecordField: n => ({
            ...n,
            name: n.hasComputedName ? transformNode(n.name, xforms) : n.name,
            expression: transformNode(n.expression, xforms),
        }),
        RecordLiteral: n => ({...n, fields: n.fields.map(field => transformNode(field, xforms))}),
        Reference: n => n,
        Selection: n => ({...n, exprssions: n.expressions.map(expr => transformNode(expr, xforms))}),
        Sequence: n => ({...n, exprssions: n.expressions.map(expr => transformNode(expr, xforms))}),
        StringLiteral: n => n,
        VoidLiteral: n => n,
    }) as Node;
}
