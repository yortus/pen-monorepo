import {mapMap} from '../utils';
import {assertNodeKind} from './assert-node-kind';
import type {BindingNodeKind, ExpressionNodeKind, NodeKind} from './node-kind';
import type {Node} from './nodes';


/**
 * Returns a node mapping function that maps from one type of AST to another. The returned mapping function creates and
 * returns a new node graph derived from the node graph rooted at `node`. By default, each node is recursively cloned,
 * in which case the returned node is a deep clone of `node`. The mapping function for each node kind can be specified
 * in the `mappings` object, which allows the resulting node graph to differ in structure and node kinds from the graph
 * rooted at `node`. Both the source and target ASTs must satisfy the type constraints given by `P` and `Pᐟ`.
 */
export function createAstMapper<KS extends NodeKind, KSᐟ extends NodeKind>(inNodeKind: KS[], outNodeKind: KSᐟ[]) {
    return function mapAst<MapObj, N extends NodeOfKind<KS>>(node: N, mappings: Mappings<MapObj, KS, KSᐟ>): N {
        const rec: any = (n: any) => {
            try {
                assertNodeKind(n.kind, inNodeKind);
                let mapFn = mappers[n.kind];
                let result = mapFn && mapFn !== 'default' ? mapFn(n) : defaultMappers(n);
                assertNodeKind(result.kind, outNodeKind);
                return result;
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
function makeDefaultMappers(rec: <N extends Node>(n: N) => N) {
    return (n: Node): Node => {
        switch (n.kind) {
            case 'AbstractSyntaxTree': return {...n, modulesByAbsPath: mapMap(n.modulesByAbsPath, rec)};
            case 'ApplicationExpression': return {...n, lambda: rec(n.lambda), argument: rec(n.argument)};
            case 'BooleanLiteralExpression': return n;
            case 'ExtensionExpression': return n;
            case 'FieldExpression': return {...n, name: rec(n.name), value: rec(n.value)};
            case 'GlobalBinding': return {...n, value: rec(n.value)};
            case 'GlobalReferenceExpression': return n;
            case 'ImportExpression': return n;
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return {...n, elements: n.elements.map(rec)};
            case 'LocalBinding': return {...n, value: rec(n.value)};
            case 'LocalMultiBinding': return {...n, value: rec(n.value)};
            case 'LocalReferenceExpression': return n;
            case 'MemberExpression': return {...n, module: rec(n.module)};
            case 'Module': return {...n, bindings: n.bindings.map(rec)};
            case 'ModuleExpression': return {...n, module: rec(n.module)};
            case 'NotExpression': return {...n, expression: rec(n.expression)};
            case 'NullLiteralExpression': return n;
            case 'NumericLiteralExpression': return n;
            case 'ParenthesisedExpression': return {...n, expression: rec(n.expression)};
            case 'QuantifiedExpression': return {...n, expression: rec(n.expression)};
            case 'RecordExpression': return {...n, fields: n.fields.map((f) => ({name: f.name, value: rec(f.value)}))};
            case 'SelectionExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'SequenceExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'StringLiteralExpression': return n;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    };
}


// TODO: doc...
type Mappings<MapObj, KS extends NodeKind, KSᐟ extends NodeKind> =
    (rec: <N extends Node>(n: N) => NodeOfKind<WidenKind<N['kind'], KSᐟ>>) =>
        & MapObj

        // All keys must be NodeKinds in KS
        & {[K in keyof MapObj]: K extends KS ? unknown : never}

        // All node kinds that are in KS but not in KSᐟ must be handled (or set to 'default')
        & {[K in Exclude<KS, KSᐟ>]: ((n: NodeOfKind<K>) => NodeOfKind<WidenKind<K, KSᐟ>>) | 'default'}

        // All handled node kinds must be either a mapping function, or 'default'
        & {[K in KS]?: ((n: NodeOfKind<K>) => NodeOfKind<WidenKind<K, KSᐟ>>) | 'default'};


// TODO: doc...
type WidenKind<K extends NodeKind, AllowedKinds extends NodeKind> =
    K extends ExpressionNodeKind ? Extract<ExpressionNodeKind, AllowedKinds> :
    K extends BindingNodeKind ? Extract<BindingNodeKind, AllowedKinds> :
    K extends AllowedKinds ? K :
    never;


// TODO: doc...
type NodeOfKind<K extends NodeKind, N = Node> = N extends {kind: K} ? N : never;
