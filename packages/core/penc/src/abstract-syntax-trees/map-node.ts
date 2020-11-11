import type {Expression, Node, Pattern} from './nodes';


// TODO: revise/fix jsdoc...
/**
 * Returns a recursive node mapping function that maps from one type of AST to another. The returned mapping function
 * creates and returns a new node graph derived from the node graph rooted at `node`. By default, each node is
 * recursively cloned, in which case the returned node is a deep clone of `node`. The mapping function for each node
 * kind can be specified in the `mappings` object, which allows the resulting node graph to differ in structure and node
 * kinds from the graph rooted at `node`. The source and target ASTs must satisfy the node kind constraints given by
 * `inNodeKinds` and `outNodeKinds`.
 */
export function mapNode<MapObj, N extends Node>(node: N, mappings: Mappings<MapObj>): NodeOfKind<WidenKind<N['kind']>> {
    const rec: any = (n: any) => {
        try {
            let mapFn = mappers[n.kind];
            let result = mapFn && mapFn !== 'default' ? mapFn(n) : defaultMappers(n);
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
}


// TODO: ...
function makeDefaultMappers(rec: <N extends Node>(n: N) => N) {
    return (n: Node): Node => {
        switch (n.kind) {
            case 'ApplicationExpression': return {...n, lambda: rec(n.lambda), argument: rec(n.argument)};
            case 'BooleanLiteral': return n;
            case 'Binding': return {...n, left: rec(n.left), right: rec(n.right)};
            case 'Definition': return {...n, expression: rec(n.expression)};
            case 'ExtensionExpression': return n;
            case 'FieldExpression': return {...n, name: rec(n.name), value: rec(n.value)};
            case 'Identifier': return n;
            case 'ImportExpression': return n;
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return {...n, elements: n.elements.map(rec)};
            case 'MemberExpression': return {...n, module: rec(n.module)};
            case 'Module': return {...n, bindings: n.bindings.map(rec)};
            case 'ModuleExpression': return {...n, module: rec(n.module)};
            case 'ModulePattern': return n;
            case 'NotExpression': return {...n, expression: rec(n.expression)};
            case 'NullLiteral': return n;
            case 'NumericLiteral': return n;
            case 'ParenthesisedExpression': return {...n, expression: rec(n.expression)};
            case 'QuantifiedExpression': return {...n, expression: rec(n.expression)};
            case 'RecordExpression': return {...n, fields: n.fields.map((f) => ({name: f.name, value: rec(f.value)}))};
            case 'ReferenceExpression': return n;
            case 'SelectionExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'SequenceExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'StringLiteral': return n;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    };
}


// Helper type for constraining and contextually typing the node mapping functions.
type Mappings<MapObj> =
    (rec: <N extends Node>(n: N) => NodeOfKind<WidenKind<N['kind']>>) =>
        & MapObj

        // All keys must be NodeKinds
        & {[K in keyof MapObj]: K extends Node['kind'] ? unknown : never}

        // All handled node kinds must be a mapping function
        & {[K in Node['kind']]?: ((n: NodeOfKind<K>) => NodeOfKind<WidenKind<K>>)};


// Helper type for widening specific node kinds to general node kind categories.
type WidenKind<K extends Node['kind']> =
    K extends Expression['kind'] ? Expression['kind'] :
    K extends Pattern['kind'] ? Pattern['kind'] :
    K extends Node['kind'] ? K :
    never;


// Helper type returning the union of nodes corresponding to the given union of node kinds.
type NodeOfKind<K extends Node['kind'], N = Node> = N extends {kind: K} ? N : never;
