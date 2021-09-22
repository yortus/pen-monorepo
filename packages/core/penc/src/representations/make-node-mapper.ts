import {mapObj} from '../utils';
import type {Binding, Expression, Node, Pattern, Version} from './versioned-ast';

// TODO: revise/fix outdated jsdoc...
/**
 * Returns a recursive node mapping function that maps from one type of AST to another. The returned mapping function
 * creates and returns a new node graph derived from the node graph rooted at `node`. By default, each node is
 * recursively cloned, in which case the returned node is a deep clone of `node`. The mapping function for each node
 * kind can be specified in the `mappings` object, which allows the resulting node graph to differ in structure and node
 * kinds from the graph rooted at `node`. The source and target ASTs must satisfy the node kind constraints given by
 * `inNodeKinds` and `outNodeKinds`.
 */
export function makeNodeMapper<V extends Version, Vᐟ extends Version>() {
    return function mapNode<MapObj, N extends Node<V>>(node: N, mappings: Mappings<MapObj, V, Vᐟ>): MappedNode<N, V, Vᐟ> {
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
}


// TODO: ...
function makeDefaultMappers(rec: <N extends Node>(n: N) => N) {
    return (n: Node): Node => {
        switch (n.kind) {
            case 'AbstractExpression': return {...n, expression: rec(n.expression)};
            case 'ApplicationExpression': return {...n, function: rec(n.function), argument: rec(n.argument)};
            case 'Binding': return {...n, left: rec(n.left), right: rec(n.right)};
            case 'BooleanLiteral': return n;
            case 'ByteExpression': return n;
            case 'ConcreteExpression': return {...n, expression: rec(n.expression)};
            case 'Field': return {...n, label: typeof n.label === 'string' ? n.label : rec(n.label), expression: rec(n.expression)};
            case 'FunctionExpression': return typeof n.param === 'string' ? {...n, body: rec(n.body) as any} : {...n, param: rec(n.param), body: rec(n.body)}; // TODO: fix any cast
            case 'FunctionParameter': return n;
            case 'Identifier': return n;
            case 'Import': return {...n, pattern: rec(n.pattern)};
            case 'Intrinsic': return n;
            case 'LetExpression': return {...n, expression: rec(n.expression), bindings: Array.isArray(n.bindings) ? n.bindings.map(rec) : mapObj(n.bindings, rec)};
            case 'ListExpression': return {...n, items: n.items.map(rec)};
            case 'MemberExpression': return {...n, module: rec(n.module)};
            case 'Module': return {...n, imports: n.imports.map(rec) as any, bindings: Array.isArray(n.bindings) ? n.bindings.map(rec) : mapObj(n.bindings, rec)}; // TODO: fix any cast
            case 'ModulePattern': return n;
            case 'NotExpression': return {...n, expression: rec(n.expression)};
            case 'NullLiteral': return n;
            case 'NumericLiteral': return n;
            case 'ParenthesisedExpression': return {...n, expression: rec(n.expression)};
            case 'QuantifiedExpression': return {...n, expression: rec(n.expression)};
            case 'RecordExpression': return {...n, items: n.items.map(rec)};
            case 'SelectionExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'SequenceExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'Splice': return {...n, expression: rec(n.expression)};
            case 'StringExpression': return {...n, items: n.items.map(i => (typeof i === 'object' && !Array.isArray(i)) ? rec(i) : i)};

            case 'StringLiteral': return n;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    };
}


// Helper type for constraining and contextually typing the node mapping functions.
type Mappings<MapObj, V extends Version, Vᐟ extends Version> =
    (rec: <N extends Node<V>>(n: N) => MappedNode<N, V, Vᐟ>) =>
        & MapObj

        // All keys must be NodeKinds
        & {[K in keyof MapObj]: K extends Node<V>['kind'] ? unknown : never}

        // All handled node kinds must be a mapping function
        & {[K in Node<V>['kind']]?: ((n: NodeOfKind<V, K>) => MappedNode<NodeOfKind<V, K>, V, Vᐟ>)};

// TODO: doc...
type MappedNode<N extends Node<V>, V extends Version, Vᐟ extends Version> =
    N extends Expression<V> ? Expression<Vᐟ> :
    N extends Binding<V> ? Binding<Vᐟ> :
    N extends Pattern<V> ? Pattern<Vᐟ> :
    never;

// Helper type returning the union of nodes corresponding to the given union of node kinds.
type NodeOfKind<V extends Version, K extends Node['kind'], N = Node<V>> = N extends {kind: K} ? N : never;
