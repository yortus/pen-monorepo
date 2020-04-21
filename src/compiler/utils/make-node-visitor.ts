import {Node} from '../ast-nodes';
import {mapMap} from './map-map';


// TODO: doc...
export function makeNodeVisitor<N extends Node>() {
    return function visitNode<SpecificNode extends N, VisObj>(node: SpecificNode, makeVisitors: MakeVisitors<N, VisObj>) {
        const rec: <NN extends N>(n: NN) => void = n => {
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
            case 'ApplicationExpression': return rec(n.lambda), rec(n.argument);
            case 'Binding': return rec(n.pattern), rec(n.value);
            case 'BindingLookupExpression': return rec(n.module);
            case 'BooleanLiteralExpression': return;
            case 'CharacterExpression': return;
            case 'FieldExpression': return rec(n.name), rec(n.value);
            case 'ImportExpression': return;
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return n.elements.forEach(rec);
            case 'Module': return n.bindings.forEach(rec);
            case 'ModuleExpression': return rec(n.module);
            case 'ModulePattern': return n.names.forEach(rec);
            case 'ModulePatternName': return;
            case 'NullLiteralExpression': return;
            case 'ParenthesisedExpression': return rec(n.expression);
            case 'Program': return mapMap(n.sourceFiles, rec), undefined;
            case 'RecordExpression': return n.fields.forEach(rec);
            case 'ReferenceExpression': return;
            case 'SelectionExpression': return n.expressions.forEach(rec);
            case 'SequenceExpression': return n.expressions.forEach(rec);
            case 'SourceFile': return rec(n.module);
            case 'StaticField': return rec(n.value);
            case 'StringLiteralExpression': return;
            case 'VariablePattern': return;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    };
}


// TODO: doc...
type MakeVisitors<N extends Node, VisObj> =
    (rec: <SpecificNode extends N>(n: SpecificNode) => void) => (
        & VisObj
        & {[K in keyof VisObj]: K extends Node['kind'] ? unknown : never}
        & {[K in Node['kind']]?: (n: NodeOfKind<N, K>) => void}
    );


/**
 * Helper type that narrows from the union of node types `N` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<N extends Node, K extends Node['kind']> = N extends {kind: K} ? N : never;
