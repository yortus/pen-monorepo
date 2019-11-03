import {Node as AnyPassNode} from './nodes';
type Node = AnyPassNode<'pass2'>;




/**
 * Iterates over each direct child node of the given `node`, invoking the specified `visitor`
 * function once for each child node. If `node` is a leaf node, this function does nothing.
 * @param node the node whose children are to be visited.
 * @param visitor the function to invoke on each child node.
 * @returns no return value. The `visitor` functions are executed for their side-effects.
 */
export function forEachChildNode(node: Node, visitor: (childNode: Node) => void) {
    switch (node.kind) {
        case 'Application': return visitNodes(visitor, node.function, ...node.arguments);
        case 'Block': return visitNodes(visitor, ...node.definitions);
        case 'CharacterRange': return;
        case 'Definition': return visitNodes(visitor, node.expression);
        case 'Function': return visitNodes(visitor, node.expression);
        case 'ImportNames': return;
        case 'ImportNamespace': return;
        case 'ListLiteral': return visitNodes(visitor, ...node.elements);
        case 'ModuleDefinition': return visitNodes(visitor, ...node.imports, node.block);
        case 'Parenthetical': return visitNodes(visitor, node.expression);
        case 'RecordField': return visitNodes(visitor, ...(node.hasComputedName ? [node.name] : []), node.expression);
        case 'RecordLiteral': return visitNodes(visitor, ...node.fields);
        case 'Reference': return;
        case 'Selection': return visitNodes(visitor, ...node.expressions);
        case 'Sequence': return visitNodes(visitor, ...node.expressions);
        case 'StringLiteral': return;
        case 'VoidLiteral': return;

        // Ensure both statically and at runtime that *every* node type has been handled by the switch cases above.
        default: ((_: never) => { throw new Error(`Internal error: unrecognised node '${node}'`); })(node);
    }
}




// Helper function to simplify the switch block in `forEachChildNode`.
function visitNodes(visitor: (n: Node) => void, ...nodes: Node[]) {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < nodes.length; ++i) {
        visitor(nodes[i]);
    }
}
