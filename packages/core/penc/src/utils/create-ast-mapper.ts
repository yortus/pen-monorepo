import {BindingKind, ExpressionKind, Node, NodeKind, NodeKindsFromProgram, Program} from '../representations';
import {mapMap} from './map-map';


/**
 * Returns an AST mapping function that maps from one type of AST to another. The returned mapping function creates and
 * returns a new AST derived from the AST rooted at `node`. By default, each node is recursively cloned, in which case
 * the returned AST is a deep clone of `node`. The mapping function for each node kind can be specified in the
 * `mappings` object, which allows the resulting AST to differ in structure and node kinds from the AST given by `node`.
 * Both the source and target ASTs must satisfy the type constraints given by `P` and `Pᐟ`.
 */
export function createAstMapper<P extends Program, Pᐟ extends Program>() {
    type KS = NodeKindsFromProgram<P>;
    type KSᐟ = NodeKindsFromProgram<Pᐟ>;
    return function mapAst<N extends {kind: KS}, MapObj>(node: N, mappings: Mappings<MapObj, KS, KSᐟ>) {
        const rec: any = (n: any) => {
            try {
                let mapFn = mappers[n.kind];
                let result = mapFn ? mapFn(n) : defaultMappers(n);
                return result;
            }
            catch (err) {
                // TODO: how to handle? May be better to let caller handle it?
                throw err;
            }
        };
        const defaultMappers: any = makeDefaultMappers(rec);
        const mappers: any = mappings(rec);
        return rec(node) as NodeOfKind<KSᐟ, N['kind']>;
    };
}


// TODO: ...
function makeDefaultMappers(rec: <N extends Node>(n: N) => N) {
    return (n: Node): Node => {
        switch (n.kind) {
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
            case 'ModuleMap': return {...n, byAbsPath: mapMap(n.byAbsPath, rec)};
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
    (rec: <N extends Node<KS>>(n: N) => NodeOfKind<KSᐟ, WidenKind<N['kind']>>) => MapObj & {
        [K in keyof MapObj]:
            K extends KS ? (n: NodeOfKind<KS, K>) => NodeOfKind<KSᐟ, WidenKind<K>> :
            never;
    };

type WidenKind<K extends NodeKind> =
    K extends ExpressionKind ? ExpressionKind :
    K extends BindingKind ? BindingKind :
    K;


/**
 * Helper type that narrows from the union of node types `NS` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
