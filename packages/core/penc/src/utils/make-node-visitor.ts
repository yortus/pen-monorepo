import {Node, NodeKind} from '../ast-nodes';
import {mapMap} from './map-map';


// TODO: doc...
export function makeNodeVisitor<KS extends NodeKind, R = void>() {
    return function nodeVisitor<N extends Node<KS>, VisObj>(node: N, makeVisitors: MakeVisitors<VisObj, KS, R>): R {
        const rec: any = (n: any) => {
            try {
                let visFn = visitors[n.kind];
                return visFn ? visFn(n) : defaultVisitors(n);
            }
            catch (err) {
                // TODO: how to handle? May be better to let caller handle it?
                throw err;
            }
        };
        const defaultVisitors: any = makeDefaultVisitors(rec as any);
        const visitors: any = makeVisitors(rec);
        return rec(node);
    };
}


// TODO: ...
function makeDefaultVisitors(rec: <N extends Node>(n: N) => void) {
    return (n: Node): void => {
        switch (n.kind) {
            case 'ApplicationExpression': return rec(n.lambda), rec(n.argument), undefined;
            case 'BooleanLiteralExpression': return;
            case 'DestructuredBinding': return rec(n.value), undefined;
            case 'ExtensionExpression': return;
            case 'FieldExpression': return rec(n.name), rec(n.value), undefined;
            case 'ImportExpression': return;
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return n.elements.forEach(rec), undefined;
            case 'MemberExpression': return rec(n.module), undefined;
            case 'Module': return n.bindings.forEach(rec), undefined;
            case 'ModuleExpression': return rec(n.module), undefined;
            case 'NotExpression': return rec(n.expression), undefined;
            case 'NullLiteralExpression': return;
            case 'NumericLiteralExpression': return;
            case 'ParenthesisedExpression': return rec(n.expression), undefined;
            case 'Program': return mapMap(n.sourceFiles, rec), undefined;
            case 'QuantifiedExpression': return rec(n.expression), undefined;
            case 'RecordExpression': return n.fields.forEach(f => rec(f.value)), undefined;
            case 'ReferenceExpression': return;
            case 'SelectionExpression': return n.expressions.forEach(rec), undefined;
            case 'SequenceExpression': return n.expressions.forEach(rec), undefined;
            case 'SimpleBinding': return rec(n.value), undefined;
            case 'StringLiteralExpression': return;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    };
}


// TODO: doc...
type MakeVisitors<VisObj, KS extends NodeKind, R> =
    (rec: <N extends Node<KS>>(n: N) => R) => VisObj & {
        [K in keyof VisObj]: K extends KS ? (n: NodeOfKind<KS, K>) => R : never
    };


/**
 * Helper type that narrows from the union of node types `NS` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
