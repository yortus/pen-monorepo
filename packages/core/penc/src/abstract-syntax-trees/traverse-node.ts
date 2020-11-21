import type {Node} from './nodes';


/** Performs a depth-first traversal with `node` as root, calling `cb` on each node encountered in the traversal. */
export function traverseNode(node: Node, callback: (n: Node) => void): void {
    const cb = callback as (n: Node) => void;
    return rec(node);

    function rec(n: Node): void {
        switch (n.kind) {
            case 'ApplicationExpression': return rec(n.lambda), rec(n.argument), cb(n);
            case 'Binding': return rec(n.left), rec(n.right), cb(n);
            case 'BooleanLiteral': return cb(n);
            case 'Definition': return rec(n.value), cb(n);
            case 'FieldExpression': return rec(n.name), rec(n.value), cb(n);
            case 'Identifier': return cb(n);
            case 'ImportExpression': return cb(n);
            case 'Intrinsic': return cb(n);
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return n.elements.forEach(rec), cb(n);
            case 'MemberExpression': return rec(n.module), rec(n.member), cb(n);
            case 'Module': return n.bindings.forEach(rec), cb(n);
            case 'ModuleExpression': return n.bindings.forEach(rec), cb(n);
            case 'ModulePattern': return cb(n);
            case 'NotExpression': return rec(n.expression), cb(n);
            case 'NullLiteral': return cb(n);
            case 'NumericLiteral': return cb(n);
            case 'ParenthesisedExpression': return rec(n.expression), cb(n);
            case 'QuantifiedExpression': return rec(n.expression), cb(n);
            case 'RecordExpression': return n.fields.forEach(f => rec(f.value)), cb(n);
            case 'Reference': return cb(n);
            case 'SelectionExpression': return n.expressions.forEach(rec), cb(n);
            case 'SequenceExpression': return n.expressions.forEach(rec), cb(n);
            case 'SourceFile': return n.bindings.forEach(rec), cb(n);
            case 'StringLiteral': return cb(n);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    }
}
