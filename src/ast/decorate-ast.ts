import {matchNode} from './match-node';
import {nodeKinds} from './node-kinds';
import {Node} from './node-types';




// TODO: revise jsdoc...
/**
 * Generates a new AST with the same topology as the given `ast`, but where each node is replaced with
 * the result of passing it through the matching decorator function from `nodeDecorators`. Each decorator
 * function must return a node that is assignable to the node it decorates. In other words, nodes may be
 * specialised, such as by adding properties, but not generalised or changed to unrelated types. If a
 * node kind is encountered for which no decorator function is given, then the default decorator is applied.
 * The default decorator produces a new node where all child nodes have been replaced with their decorated
 * forms, and all other properties have been shallow-copied. The traversal over `ast` is depth-first, and
 * each decorator function determines whether its node is processed top-down or bottom-up, since it controls
 * when its child nodes are traversed via the `decorateChildren` callback passed to it.
 * @param ast the root node that is traversed to produce a corresponding decorated AST.
 * @param nodeDecorators an object keyed by node kind, whose values are functions that decorate that node kind.
 * @returns an AST with the same shape as `ast`, but where each node is replaced by a decorated node.
 */
export function decorateAst<N extends Node, D extends NodeDecorators>(ast: N, nodeDecorators: D) {
    const traverse = makeTraverser(nodeDecorators);
    let result = traverse(ast) as DecoratedNodeFromKind<N['kind'], D>;
    return result;
}




/** Describes an object whose keys are node kinds and whose values are node decorator functions. */
export type NodeDecorators = {[K in NodeKind]?: DecorateNode<NodeFromKind<K>>};




/**
 * A node decorator function. ~Must return a new node that is a sub-type of the given node.~
 * The decorator function must call the `decorateChildren` callback to have its child nodes
 * recursively traversed and decorated. Various top-down and bottom-up decoration strategies
 * are supported by decorating the node before and/or after passing it to this callback.
 */
export type DecorateNode<N extends Node> = (node: N, decorateChildren: <Nᐟ extends Node>(node: Nᐟ) => Nᐟ) => Node;




/** Helper type that resolves to the node type corresponding to the node kind given by `K`. */
type NodeFromKind<K extends NodeKind, N = Node> = N extends {kind: K} ? N : never;




/** String literal union of all node kinds. */
type NodeKind = Node['kind'];




/**
 * Helper type that resolves to the decorated node type corresponding to the
 * node kind given by `K`, using the decorator function signatures given in `D`.
 */
type DecoratedNodeFromKind<K extends NodeKind, D extends NodeDecorators> =
    D[K] extends DecorateNode<any> ? ReturnType<D[K]> : NodeFromKind<K>;




/**
 * Helper function that returns an AST traversal function. The returned function takes an AST, and
 * returns a new AST consisting of decorated nodes, using the decorators given in `nodeDecorators`.
 */
function makeTraverser(nodeDecorators: NodeDecorators) {

    // Create a decorator lookup object that associates a decorator function with every node kind. The decorator
    // functions are taken from `nodeDecorators` if defined there, otherwise the default decorator is used.
    const DEFAULT_DECORATOR: DecorateNode<any> = (node, decorateChildren) => decorateChildren(node);
    let allDecorators = nodeKinds.reduce(
        (decs, kind) => Object.assign(decs, {[kind]: nodeDecorators[kind] || DEFAULT_DECORATOR}),
        {} as {[K in NodeKind]: DecorateNode<Node>},
    );

    // Create the callback function that is passed to each decorator function so it can recurse to its child nodes.
    const decorateChildren = <N extends Node>(n: N): N => matchNode<unknown>(n, {
        Application: n => ({...n, combinator: decorateNode(n.combinator), arguments: n.arguments.map(decorateNode)}),
        Block: n => ({...n, definitions: n.definitions.map(decorateNode)}),
        Blockᐟ: n => ({...n, definitions: n.definitions.map(decorateNode)}),
        CharacterRange: n => n,
        Combinator: n => ({...n, expression: decorateNode(n.expression)}),
        Definition: n => ({...n, expression: decorateNode(n.expression)}),
        Definitionᐟ: n => ({...n, expression: decorateNode(n.expression)}),
        ForeignModule: n => n,
        ImportDeclaration: n => n,
        ImportDeclarationᐟ: n => n,
        ListLiteral: n => ({...n, elements: n.elements.map(decorateNode)}),
        Parenthetical: n => ({...n, expression: decorateNode(n.expression)}),
        PenModule: n => ({...n, declarations: n.declarations.map(decorateNode)}),
        RecordField: n => ({
            ...n,
            name: n.hasComputedName ? decorateNode(n.name) : n.name,
            expression: decorateNode(n.expression)
        }),
        RecordLiteral: n => ({...n, fields: n.fields.map(decorateNode)}),
        Reference: n => n,
        Referenceᐟ: n => n,
        Selection: n => ({...n, exprssions: n.expressions.map(decorateNode)}),
        Sequence: n => ({...n, exprssions: n.expressions.map(decorateNode)}),
        StringLiteral: n => n,
        VoidLiteral: n => n,
    }) as N;


    // Create and return the AST traversal function. NB: This is mutually recursive with `decorateChildren`.
    const decorateNode = (node: Node) => (allDecorators[node.kind])(node, decorateChildren);
    return decorateNode;
}
