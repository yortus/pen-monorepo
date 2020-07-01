import {Node} from '../ast-nodes';
import {mapMap} from './map-map';


// TODO: doc...
export function traverseDepthFirst<M>(node: Node<M>, cb: (n: Node<M>) => void): void {
    return rec(node);
    function rec(n: Node<M>): void {
        switch (n.kind) {
            case 'ApplicationExpression': return rec(n.lambda), rec(n.argument), cb(n);
            case 'BindingLookupExpression': return rec(n.module), cb(n);
            case 'BooleanLiteralExpression': return cb(n);
            case 'DestructuredBinding': return rec(n.value), cb(n);
            case 'ExtensionFile': return cb(n);
            case 'FieldExpression': return rec(n.name), rec(n.value), cb(n);
            case 'ImportExpression': return cb(n);
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return n.elements.forEach(rec), cb(n);
            case 'Module': return n.bindings.forEach(rec), cb(n);
            case 'ModuleExpression': return rec(n.module), cb(n);
            case 'NotExpression': return rec(n.expression), cb(n);
            case 'NullLiteralExpression': return cb(n);
            case 'NumericLiteralExpression': return cb(n);
            case 'ParenthesisedExpression': return rec(n.expression), cb(n);
            case 'PenSourceFile': return rec(n.module), cb(n);
            case 'Program': return mapMap(n.sourceFiles, rec), cb(n);
            case 'QuantifiedExpression': return rec(n.expression), cb(n);
            case 'RecordExpression': return n.fields.forEach(f => rec(f.value)), cb(n);
            case 'ReferenceExpression': return cb(n);
            case 'SelectionExpression': return n.expressions.forEach(rec), cb(n);
            case 'SequenceExpression': return n.expressions.forEach(rec), cb(n);
            case 'SimpleBinding': return rec(n.value), cb(n);
            case 'StringLiteralExpression': return cb(n);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    }
}
