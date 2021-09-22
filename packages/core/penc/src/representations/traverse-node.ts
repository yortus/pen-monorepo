import {mapObj} from '../utils';
import type {Node, Version} from './versioned-ast';


/** Performs a depth-first traversal with `node` as root, calling `cb` on each node encountered in the traversal. */
export function traverseNode<V extends Version>(node: Node<V>, callback: (n: Node<V>) => void): void {
    const cb = callback as (n: Node) => void;
    return rec(node);

    function rec(n: Node): void {
        switch (n.kind) {
            case 'AbstractExpression': return rec(n.expression), cb(n);
            case 'ApplicationExpression': return rec(n.function), rec(n.argument), cb(n);
            case 'Binding': return rec(n.left), rec(n.right), cb(n);
            case 'BooleanLiteral': return cb(n);
            case 'ByteExpression': return cb(n);
            case 'ConcreteExpression': return rec(n.expression), cb(n);
            case 'Field': return (typeof n.label === 'string' || rec(n.label)), rec(n.expression), cb(n);
            case 'FunctionExpression': return typeof n.param === 'string' ? n.param : rec(n.param), rec(n.body), cb(n);
            case 'FunctionParameter': return cb(n);
            case 'Identifier': return cb(n);
            case 'Import': return rec(n.pattern), cb(n);
            case 'Intrinsic': return cb(n);
            case 'LetExpression': return cb(n.expression), Array.isArray(n.bindings) ? n.bindings.map(rec) : mapObj(n.bindings, rec), cb(n);
            case 'ListExpression': return n.items.forEach(rec), cb(n);
            case 'MemberExpression': return rec(n.module), cb(n);
            case 'Module': return n.imports.map(rec), Array.isArray(n.bindings) ? n.bindings.map(rec) : mapObj(n.bindings, rec), cb(n);
            case 'ModulePattern': return cb(n);
            case 'NotExpression': return rec(n.expression), cb(n);
            case 'NullLiteral': return cb(n);
            case 'NumericLiteral': return cb(n);
            case 'ParenthesisedExpression': return rec(n.expression), cb(n);
            case 'QuantifiedExpression': return rec(n.expression), cb(n);
            case 'RecordExpression': return n.items.forEach(rec), cb(n);
            case 'SelectionExpression': return n.expressions.forEach(rec), cb(n);
            case 'SequenceExpression': return n.expressions.forEach(rec), cb(n);
            case 'Splice': return rec(n.expression), cb(n);
            case 'StringExpression': return n.items.forEach(i => typeof i === 'object' && !Array.isArray(i) && rec(i)), cb(n);
            case 'StringLiteral': return cb(n);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    }
}
