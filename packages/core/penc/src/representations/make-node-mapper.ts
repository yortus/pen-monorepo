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
            case 'Binding': return {...n, left: rec(n.left), right: rec(n.right)};
            case 'BooleanLiteral': return n;
            case 'CodeExpression': return {...n, expression: rec(n.expression)};
            case 'FieldExpression': return {...n, name: rec(n.name), value: rec(n.value)};
            case 'GenericExpression': return typeof n.param === 'string' ? {...n, body: rec(n.body) as any} : {...n, param: rec(n.param), body: rec(n.body)}; // TODO: fix any cast
            case 'GenericParameter': return n;
            case 'Identifier': return n;
            case 'ImportExpression': return n;
            case 'InstantiationExpression': return {...n, generic: rec(n.generic), argument: rec(n.argument)};
            case 'Intrinsic': return n;
            case 'LetExpression': return {...n, expression: rec(n.expression), bindings: Array.isArray(n.bindings) ? n.bindings.map(rec) : mapObj(n.bindings, rec)};
            case 'ListElement': return {...n, expression: rec(n.expression)};
            case 'ListExpression': return {...n, items: n.items.map(rec)};
            case 'ListSplice': return {...n, list: rec(n.list)};
            case 'MemberExpression': return {...n, module: rec(n.module)};
            case 'Module': return {...n, bindings: Array.isArray(n.bindings) ? n.bindings.map(rec) : mapObj(n.bindings, rec)};
            case 'ModulePattern': return n;
            case 'NotExpression': return {...n, expression: rec(n.expression)};
            case 'NullLiteral': return n;
            case 'NumericLiteral': return n;
            case 'ParenthesisedExpression': return {...n, expression: rec(n.expression)};
            case 'QuantifiedExpression': return {...n, expression: rec(n.expression)};
            case 'RecordExpression': return {...n, fields: n.fields.map((f) => ({name: f.name, value: rec(f.value)}))};

            // TODO: new...
            // case 'RecordExpression': return {
            //     ...n,
            //     items: n.items.map(it => it.kind === 'Field'
            //         ? {...it, name: typeof it.name === 'string' ? it.name : rec(it.name), value: rec(it.expression)}
            //         : {...it, record: rec(it.record)}
            //     )
            // };

            case 'SelectionExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'SequenceExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'StringAbstract': return n;
            case 'StringUniversal': return n;
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
