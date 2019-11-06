import {matchNode} from './match-node';
import {Node} from './node';
import {NodeVersion} from './node-version';


/**
 * Iterates over each direct child node of the given `node`, invoking the specified `visitor`
 * function once for each child node. If `node` is a leaf node, this function does nothing.
 * @param node the node whose children are to be visited.
 * @param visitor the function to invoke on each child node.
 * @returns no return value. The `visitor` functions are executed for their side-effects.
 */
export function getChildNodes<V extends NodeVersion>(node: Node<V>): Array<Node<V>> {
    return matchNode<V, Array<Node<V>>>(node, {
        Application: n => [n.function, ...n.arguments],
        Block: n => [...n.definitions],
        CharacterRange: () => [],
        Definition: n => [n.expression],
        Function: n => [n.expression],
        ImportNames: () => [],
        ImportNamespace: () => [],
        ListLiteral: n => [...n.elements],
        ModuleDefinition: n => [...n.imports, n.block],
        Parenthetical: n => [n.expression],
        RecordField: n => n.hasComputedName ? [n.name, n.expression] : [n.expression],
        RecordLiteral:n => [...n.fields],
        Reference: () => [],
        Selection: n => [...n.expressions],
        Sequence: n => [...n.expressions],
        StringLiteral: () => [],
        VoidLiteral: () => [],
    });
}




// Helper function to simplify the switch block in `forEachChildNode`.
function visitNodes<V extends NodeVersion>(visitor: (n: Node<V>) => void, ...nodes: Array<Node<V>>) {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < nodes.length; ++i) {
        visitor(nodes[i]);
    }
}
