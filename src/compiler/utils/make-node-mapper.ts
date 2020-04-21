import {Node} from '../ast-nodes';
import {mapMap} from './map-map';


// TODO: doc...
export function makeNodeMapper<N extends Node, Nᐟ extends Node>() {
    return function mapNode<SpecificNode extends N, MapObj>(node: SpecificNode, mappings: Mappings<N, Nᐟ, MapObj>) {
        const rec: <NN extends N>(n: NN) => NodeOfKind<Nᐟ, NN['kind']> = n => {
            try {
                let mapFn = mappers[n.kind];
                return mapFn ? mapFn(n) : defaultMappers(n);
            }
            catch (err) {
                [] = [err]; // TODO: how to handle? May be better to let caller handle it?
                throw err;
            }
        };
        const defaultMappers: any = makeDefaultMappers(rec as any);
        const mappers: any = mappings(rec);
        return rec(node);
    };
}


// TODO: ...
function makeDefaultMappers(rec: <SpecificNode extends Node>(n: SpecificNode) => SpecificNode) {
    return (n: Node): Node => {
        switch (n.kind) {
            case 'ApplicationExpression': return {...n, lambda: rec(n.lambda), argument: rec(n.argument)};
            case 'Binding': return {...n, pattern: rec(n.pattern), value: rec(n.value)};
            case 'BindingLookupExpression': return {...n, module: rec(n.module)};
            case 'BooleanLiteralExpression': return n;
            case 'CharacterExpression': return n;
            case 'FieldExpression': return {...n, name: rec(n.name), value: rec(n.value)};
            case 'ImportExpression': return n;
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return {...n, elements: n.elements.map(rec)};
            case 'Module': return {...n, bindings: n.bindings.map(rec)};
            case 'ModuleExpression': return {...n, module: rec(n.module)};
            case 'ModulePattern': return {...n, names: n.names.map(rec)};
            case 'ModulePatternName': return n;
            case 'NullLiteralExpression': return n;
            case 'ParenthesisedExpression': return {...n, expression: rec(n.expression)};
            case 'Program': return {...n, sourceFiles: mapMap(n.sourceFiles, rec)};
            case 'RecordExpression': return {...n, fields: n.fields.map(rec)};
            case 'ReferenceExpression': return n;
            case 'SelectionExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'SequenceExpression': return {...n, expressions: n.expressions.map(rec)};
            case 'SourceFile': return {...n, module: rec(n.module)};
            case 'StaticField': return {...n, value: rec(n.value)};
            case 'StringLiteralExpression': return n;
            case 'VariablePattern': return n;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    };
}


// TODO: doc...
type Mappings<N extends Node, Nᐟ extends Node, MapObj> =
    (rec: <SpecificNode extends N>(n: SpecificNode) => NodeOfKind<Nᐟ, SpecificNode['kind']>) => (
        & MapObj
        & {[K in keyof MapObj]: K extends Node['kind'] ? unknown : never}
        & {[K in DiffMetaKeys<N, Nᐟ>]: (n: NodeOfKind<N, K>) => NodeOfKind<Nᐟ, K>}
        & {[K in Node['kind']]?: (n: NodeOfKind<N, K>) => NodeOfKind<Nᐟ, K>}
    );


/**
 * Helper type that narrows from the union of node types `N` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<N extends Node, K extends Node['kind']> = N extends {kind: K} ? N : never;


// TODO: doc...
type DiffMetaKeys<N extends Node, Nᐟ extends Node> =
    N extends Node<infer M> ? (
        Nᐟ extends Node<infer Mᐟ> ? (
            {
                [K in keyof M | keyof Mᐟ]:
                    SameType<
                        K extends keyof M ? M[K] : unknown,
                        K extends keyof Mᐟ ? Mᐟ[K] : unknown
                    > extends true ? never : K
            }[keyof M | keyof Mᐟ]
        )
        : never
    )
    : never;


// TODO: doc...
type SameType<T, U> = T extends U ? U extends T ? true : false : false;
