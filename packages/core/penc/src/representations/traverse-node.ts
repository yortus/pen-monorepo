import {mapObj} from '../utils';
import type {Node, Version} from './versioned-ast';


/** Performs a depth-first traversal with `node` as root, calling `cb` on each node encountered in the traversal. */
export function traverseNode<V extends Version>(node: Node<V>, callback: (n: Node<V>) => void): void {
    const cb = callback as (n: Node) => void;
    return rec(node);

    function rec(n: Node): void {
        switch (n.kind) {
            case 'Binding': return rec(n.left), rec(n.right), cb(n);
            case 'BooleanLiteral': return cb(n);
            case 'CodeExpression': return rec(n.expression), cb(n);
            case 'FieldExpression': return rec(n.name), rec(n.value), cb(n);
            case 'GenericExpression': return typeof n.param === 'string' ? n.param : rec(n.param), rec(n.body), cb(n);
            case 'GenericParameter': return cb(n);
            case 'Identifier': return cb(n);
            case 'ImportExpression': return cb(n);
            case 'InstantiationExpression': return rec(n.generic), rec(n.argument), cb(n);
            case 'Intrinsic': return cb(n);
            case 'LetExpression': return cb(n.expression), Array.isArray(n.bindings) ? n.bindings.map(rec) : mapObj(n.bindings, rec), cb(n);
            case 'ListExpression': return n.items.forEach(it => it.kind === 'Element' ? rec(it.expression) : rec(it.list)), cb(n);
            case 'MemberExpression': return rec(n.module), cb(n);
            case 'Module': return Array.isArray(n.bindings) ? n.bindings.map(rec) : mapObj(n.bindings, rec), cb(n);
            case 'ModulePattern': return cb(n);
            case 'NotExpression': return rec(n.expression), cb(n);
            case 'NullLiteral': return cb(n);
            case 'NumericLiteral': return cb(n);
            case 'ParenthesisedExpression': return rec(n.expression), cb(n);
            case 'QuantifiedExpression': return rec(n.expression), cb(n);
            case 'RecordExpression': return n.fields.forEach(f => rec(f.value)), cb(n);
            case 'SelectionExpression': return n.expressions.forEach(rec), cb(n);
            case 'SequenceExpression': return n.expressions.forEach(rec), cb(n);
            case 'StringAbstract': return cb(n);
            case 'StringUniversal': return cb(n);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    }
}
