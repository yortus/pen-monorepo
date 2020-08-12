import {Expression, ExpressionKind, Node, NodeKind} from '../ast-nodes';
import {mapMap} from './map-map';


// TODO: doc...
export function makeNodeMapper<NS extends {kind: NodeKind}, NSᐟ extends {kind: NodeKind}>() {
    return function nodeMapper<N extends NS, MapObj>(node: N, mappings: Mappings<MapObj, NS, NSᐟ>): NodeOfKind<NSᐟ, N['kind']> {
        const rec: any = (n: any) => {
            try {
                // If result is an expression, call the general 'PreExpression' handler if provided, before mapping.
                if (ExpressionKind.includes(n.kind) && mappers.PreExpression) {
                    n = mappers.PreExpression(n) ?? n;
                }

                let mapFn = mappers[n.kind];
                return mapFn ? mapFn(n) : defaultMappers(n);
            }
            catch (err) {
                // TODO: how to handle? May be better to let caller handle it?
                throw err;
            }
        };
        const defaultMappers: any = makeDefaultMappers(rec);
        const mappers: any = mappings(rec);
        return rec(node);
    };
}


// TODO: ...
function makeDefaultMappers(rec: <SpecificNode extends Node>(n: SpecificNode) => SpecificNode) {
    return (n: Node): Node => {
        switch (n.kind) {
            case 'ApplicationExpression': return {...n, lambda: rec(n.lambda), argument: rec(n.argument)};
            case 'BooleanLiteralExpression': return n;
            case 'DestructuredBinding': return {...n, value: rec(n.value)};
            case 'ExtensionExpression': return n;
            case 'FieldExpression': return {...n, name: rec(n.name), value: rec(n.value)};
            case 'ImportExpression': return n;
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return {...n, elements: n.elements.map(rec)};
            case 'MemberExpression': return {...n, module: rec(n.module)};
            case 'Module': return {...n, bindings: n.bindings.map(rec)};
            case 'ModuleExpression': return {...n, module: rec(n.module)};
            case 'NotExpression': return {...n, expression: rec(n.expression)};
            case 'NullLiteralExpression': return n;
            case 'NumericLiteralExpression': return n;
            case 'ParenthesisedExpression': return {...n, expression: rec(n.expression)};
            case 'Program': return {...n, sourceFiles: mapMap(n.sourceFiles, rec)};
            case 'QuantifiedExpression': return {...n, expression: rec(n.expression)};
            case 'RecordExpression': return {...n, fields: n.fields.map((f) => ({name: f.name, value: rec(f.value)}))};
            case 'ReferenceExpression': return n;
            case 'SelectionExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'SequenceExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'SimpleBinding': return {...n, value: rec(n.value)};
            case 'StringLiteralExpression': return n;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    };
}


// TODO: doc...
type Mappings<MapObj, NS extends {kind: NodeKind}, NSᐟ extends {kind: NodeKind}> =
    (rec: <N extends NS>(n: N) => NodeOfKind<NSᐟ, N['kind']>) => MapObj & {
        [K in keyof MapObj]:
            K extends NS['kind'] ? (n: NodeOfKind<NS, K>) => NodeOfKind<NSᐟ, K> :
            K extends 'PreExpression' ? (n: Expression<NS['kind']>) => Expression<NS['kind']> | undefined :
            never
    };



/**
 * Helper type that narrows from the union of node types `NS` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<NS extends {kind: NodeKind}, K extends NodeKind, N extends NS = NS> = N extends {kind: K} ? N : never;
