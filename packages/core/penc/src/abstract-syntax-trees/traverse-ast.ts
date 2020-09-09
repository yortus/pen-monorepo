import {mapMap} from '../utils';
import type {Node, AbstractSyntaxTree} from './nodes';


/** Performs a depth-first traversal of the AST rooted at `node`, calling `cb` on each node. */
export function traverseAst(ast: AbstractSyntaxTree, callback: (n: Node) => void): void {
    let cb = callback as (n: Node) => void;
    return rec(ast);

    function rec(n: Node): void {
        switch (n.kind) {
            case 'AbstractSyntaxTree': return mapMap(n.modulesByAbsPath, rec), cb(n);
            case 'ApplicationExpression': return rec(n.lambda), rec(n.argument), cb(n);
            case 'BooleanLiteralExpression': return cb(n);
            case 'ExtensionExpression': return cb(n);
            case 'FieldExpression': return rec(n.name), rec(n.value), cb(n);
            case 'GlobalBinding': return rec(n.value), cb(n);
            case 'GlobalReferenceExpression': return cb(n);
            case 'ImportExpression': return cb(n);
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return n.elements.forEach(rec), cb(n);
            case 'LocalBinding': return rec(n.value), cb(n);
            case 'LocalMultiBinding': return rec(n.value), cb(n);
            case 'LocalReferenceExpression': return cb(n);
            case 'MemberExpression': return rec(n.module), cb(n);
            case 'Module': return n.bindings.forEach(rec), cb(n);
            case 'ModuleExpression': return rec(n.module), cb(n);
            case 'NotExpression': return rec(n.expression), cb(n);
            case 'NullLiteralExpression': return cb(n);
            case 'NumericLiteralExpression': return cb(n);
            case 'ParenthesisedExpression': return rec(n.expression), cb(n);
            case 'QuantifiedExpression': return rec(n.expression), cb(n);
            case 'RecordExpression': return n.fields.forEach(f => rec(f.value)), cb(n);
            case 'SelectionExpression': return n.expressions.forEach(rec), cb(n);
            case 'SequenceExpression': return n.expressions.forEach(rec), cb(n);
            case 'StringLiteralExpression': return cb(n);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    }
}
