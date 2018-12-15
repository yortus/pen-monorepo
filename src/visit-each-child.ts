import {Node} from './ast-types';




export function visitEachChild(node: Node, visitor: Visitor) {
    switch (node.nodeType) {
        case 'Application': return visitNodes(visitor, node.id, ...node.arguments);
        case 'Binding': return visitNodes(visitor, node.id, node.expression);
        case 'Identifier': return;
        case 'Module': return visitNodes(visitor, ...node.bindings);
        case 'ParenthesizedExpression': return visitNodes(visitor, node.expression);
        case 'Record': return visitNodes(visitor, ...node.fields);
        case 'RecordField': return visitNodes(visitor, node.name, node.value);
        case 'Selection': return visitNodes(visitor, ...node.expressions);
        case 'Sequence': return visitNodes(visitor, ...node.expressions);
        case 'StringLiteral': return;
        default: return assertNever(node);
    }
}




export type Visitor = (n: Node) => void;




function visitNodes(visitor: Visitor, ...nodes: Node[]) {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < nodes.length; ++i) {
        visitor(nodes[i]);
    }
}




function assertNever(_value: never): never {
    throw new Error(`Internal error: unhandled node type in visitEachChild`);
}
