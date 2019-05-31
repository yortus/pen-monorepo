import {matchNode} from './match-node';
import {nodeKinds} from './node-kinds';
import {Node} from './node-types';




/**
 * Generates a new AST with the same topology as the given `ast`, but where each node is replaced with
 * the result of passing it through the matching transform function from `nodeTransforms`. If a node kind is
 * encountered for which no transform function is given, then the default transform is applied. The default
 * transform produces a new node where all child nodes have been recursively replaced with their transformed
 * nodes, and all other properties have been shallow-copied. The traversal over `ast` is depth-first, and
 * each transform function determines whether its node is processed top-down or bottom-up, since it controls
 * when its child nodes are traversed via the `transformChildren` callback passed to it.
 * @param ast the root node that is traversed to produce a corresponding transformed AST.
 * @param nodeTransforms an object keyed by node kind, whose values are functions that transform that node kind.
 * @returns a new AST that is the result of traversing `ast` and applying the given tranforms to its nodes.
 */
export function transformAst<N extends Node, T extends NodeTransforms>(ast: N, nodeTransforms: T) {
    const traverse = makeTraverser(nodeTransforms);
    let result = traverse(ast) as TransformedNodeFromKind<N['kind'], T>;
    return result;
}




/** Describes an object whose keys are node kinds and whose values are node transform functions. */
export type NodeTransforms = {[K in NodeKind]?: TransformNode<NodeFromKind<K>>};




/**
 * A node transform function. The transform function must call the `transformChildren` callback to have
 * its child nodes recursively traversed and transformed. Various top-down and bottom-up AST transformation
 * strategies are supported by processing the node before and/or after passing it through this callback.
 */
export type TransformNode<N extends Node> = (node: N, transformChildren: <Nᐟ extends Node>(node: Nᐟ) => Nᐟ) => Node;




/** Helper type that resolves to the node type corresponding to the node kind given by `K`. */
type NodeFromKind<K extends NodeKind, N = Node> = N extends {kind: K} ? N : never;




/** String literal union of all node kinds. */
type NodeKind = Node['kind'];




/**
 * Helper type that resolves to the transformed node type corresponding to the
 * node kind given by `K`, using the transform function signatures given in `D`.
 */
type TransformedNodeFromKind<K extends NodeKind, T extends NodeTransforms> =
    T[K] extends TransformNode<any> ? ReturnType<T[K]> : NodeFromKind<K>;




/**
 * Helper function that returns an AST traversal function. The returned function takes an AST, and
 * returns a new AST consisting of transformed nodes, using the transforms given in `nodeTransforms`.
 */
function makeTraverser(nodeTransforms: NodeTransforms) {

    // Create a transform lookup object that associates a transform function with *every* node kind. The transform
    // functions are taken from `nodeTransforms` if defined there, otherwise the default transform is used.
    const DEFAULT_TRANSFORM: TransformNode<any> = (node, transformChildren) => transformChildren(node);
    let allTranforms = nodeKinds.reduce(
        (decs, kind) => Object.assign(decs, {[kind]: nodeTransforms[kind] || DEFAULT_TRANSFORM}),
        {} as {[K in NodeKind]: TransformNode<Node>},
    );

    // Create the callback function that is passed to each tranform function so it can recurse to its child nodes.
    const transformChildren = <N extends Node>(n: N): N => matchNode<unknown>(n, {
        Application: n => ({...n, combinator: transformNode(n.combinator), arguments: n.arguments.map(transformNode)}),
        Block: n => ({...n, definitions: n.definitions.map(transformNode)}),
        Blockᐟ: n => ({...n, definitions: n.definitions.map(transformNode)}),
        CharacterRange: n => n,
        Combinator: n => ({...n, expression: transformNode(n.expression)}),
        Definition: n => ({...n, expression: transformNode(n.expression)}),
        Definitionᐟ: n => ({...n, expression: transformNode(n.expression)}),
        ForeignModule: n => n,
        ImportDeclaration: n => n,
        ImportDeclarationᐟ: n => n,
        ListLiteral: n => ({...n, elements: n.elements.map(transformNode)}),
        Parenthetical: n => ({...n, expression: transformNode(n.expression)}),
        PenModule: n => ({...n, declarations: n.declarations.map(transformNode)}),
        PenModuleᐟ: n => ({...n, declarations: n.declarations.map(transformNode)}),
        RecordField: n => ({
            ...n,
            name: n.hasComputedName ? transformNode(n.name) : n.name,
            expression: transformNode(n.expression)
        }),
        RecordLiteral: n => ({...n, fields: n.fields.map(transformNode)}),
        Reference: n => n,
        Referenceᐟ: n => n,
        Selection: n => ({...n, exprssions: n.expressions.map(transformNode)}),
        Sequence: n => ({...n, exprssions: n.expressions.map(transformNode)}),
        StringLiteral: n => n,
        VoidLiteral: n => n,
    }) as N;


    // Create and return the AST traversal function. NB: This is mutually recursive with `transformChildren`.
    const transformNode = (node: Node) => (allTranforms[node.kind])(node, transformChildren);
    return transformNode;
}
