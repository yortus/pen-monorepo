// TODO: this function is unused so far. Why keep it?




import {Node} from './ast-types';




export function visitEachChild(node: Node, visitor: Visitor) {
    switch (node.nodeType) {
        case 'Application': return visitNodes(visitor, node.id, ...node.arguments);
        case 'Binding': return visitNodes(visitor, node.id, node.expression);
        case 'CharacterRange': return;
        case 'Identifier': return;
        case 'List': return visitNodes(visitor, ...node.elements);
        case 'ListElement': return visitNodes(visitor, node.value);
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
