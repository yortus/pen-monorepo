import {Node} from './node-types';




/**
 * Iterates over each direct child node of the given `node`, invoking the specified `visitor`
 * function once for each child node. If `node` is a leaf node, this function does nothing.
 * @param node the node whose children are to be visited.
 * @param visitor the function to invoke on each child node.
 * @returns no return value. The `visitor` functions are executed for their side-effects.
 */
export function forEachChildNode(node: Node, visitor: (childNode: Node) => void) {
    switch (node.kind) {
        case 'ForeignModule': return;
        case 'PenModule': return visitNodes(visitor, ...node.declarations);
        case 'ImportDeclaration': return;
        case 'Definition': return visitNodes(visitor, node.expression);
        case 'Selection': return visitNodes(visitor, ...node.expressions);
        case 'Sequence': return visitNodes(visitor, ...node.expressions);
        case 'Combinator': return visitNodes(visitor, node.expression);
        case 'Application': return visitNodes(visitor, node.combinator, ...node.arguments);
        case 'Block': return visitNodes(visitor, ...node.definitions);
        case 'Parenthetical': return visitNodes(visitor, node.expression);
        case 'RecordLiteral': return visitNodes(visitor, ...node.fields);
        case 'RecordField': return visitNodes(visitor, ...(node.hasComputedName ? [node.name] : []), node.expression);
        case 'ListLiteral': return visitNodes(visitor, ...node.elements);
        case 'CharacterRange': return;
        case 'StringLiteral': return;
        case 'VoidLiteral': return;
        case 'Reference': return;
        default: return assertNever(node);
    }
}




// Helper function to simplify the switch block in `forEachChildNode`.
function visitNodes(visitor: (n: Node) => void, ...nodes: Node[]) {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < nodes.length; ++i) {
        visitor(nodes[i]);
    }
}




// Helper function used in the switch block in `forEachChildNode` to ensure the cases are exhaustive.
function assertNever(_value: never): never {
    throw new Error(`Internal error: unhandled node type in forEachChildNode`);
}
