import {Node} from '../ast-nodes';
import {mapMap} from './map-map';


// TODO: doc...
export function makeNodeVisitor<N extends Node, R = void>() {
    return function nv<SpecificNode extends N, VisObj>(node: SpecificNode, makeVisitors: MakeVisitors<N, VisObj, R>) {
        const rec: <NN extends N>(n: NN) => R = n => {
            try {
                let visFn = visitors[n.kind];
                return visFn ? visFn(n) : defaultVisitors(n);
            }
            catch (err) {
                [] = [err]; // TODO: how to handle? May be better to let caller handle it?
                throw err;
            }
        };
        const defaultVisitors: any = makeDefaultVisitors(rec as any);
        const visitors: any = makeVisitors(rec);
        return rec(node);
    };
}


// TODO: ...
function makeDefaultVisitors(rec: <SpecificNode extends Node>(n: SpecificNode) => void) {
    return (n: Node): void => {
        switch (n.kind) {
            case 'ApplicationExpression': return rec(n.lambda), rec(n.argument), undefined;
            case 'Binding': return rec(n.pattern), rec(n.value), undefined;
            case 'BindingLookupExpression': return rec(n.module), undefined;
            case 'BooleanLiteralExpression': return;
            case 'CharacterExpression': return;
            case 'FieldExpression': return rec(n.name), rec(n.value), undefined;
            case 'ImportExpression': return;
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return n.elements.forEach(rec), undefined;
            case 'Module': return n.bindings.forEach(rec), undefined;
            case 'ModuleExpression': return rec(n.module), undefined;
            case 'ModulePattern': return n.names.forEach(rec), undefined;
            case 'ModulePatternName': return;
            case 'NullLiteralExpression': return;
            case 'NumericLiteralExpression': return;
            case 'ParenthesisedExpression': return rec(n.expression), undefined;
            case 'Program': return mapMap(n.sourceFiles, rec), undefined;
            case 'RecordExpression': return n.fields.forEach(rec), undefined;
            case 'ReferenceExpression': return;
            case 'SelectionExpression': return n.expressions.forEach(rec), undefined;
            case 'SequenceExpression': return n.expressions.forEach(rec), undefined;
            case 'SourceFile': return rec(n.module), undefined;
            case 'StaticField': return rec(n.value), undefined;
            case 'StringLiteralExpression': return;
            case 'VariablePattern': return;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    };
}


// TODO: doc...
type MakeVisitors<N extends Node, VisObj, R> =
    (rec: <SpecificNode extends N>(n: SpecificNode) => R) => (
        & VisObj
        & {[K in keyof VisObj]: K extends Node['kind'] ? unknown : never}   // all keys must be node kinds
        & {[K in Node['kind']]?: (n: NodeOfKind<N, K>) => R}                // all values must be visitor functions
    );


/**
 * Helper type that narrows from the union of node types `N` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<N extends Node, K extends Node['kind']> = N extends {kind: K} ? N : never;
