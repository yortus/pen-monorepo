// TODO: this function is unused so far. Why keep it?




import {Node} from './ast-types';




export function visitEachChild(node: Node, visitor: Visitor) {
    switch (node.kind) {
        case 'ForeignModule': return;
        case 'PenModule': return visitNodes(visitor, ...node.declarations);
        case 'ImportDeclaration': return;
        case 'ExportDeclaration': return visitNodes(visitor, node.definition);
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
