import {Node} from './node-types';


// TODO: doc...
export function makeNodeMapper<N extends Node, Nᐟ extends Node>() {
    return function mapNode<SpecificNode extends N, MapObj>(node: SpecificNode, mappings: Mappings<N, Nᐟ, MapObj>) {
        const rec: <NN extends N>(n: NN) => NodeOfKind<Nᐟ, NN['kind']> = n => {
            try {
                let mapFn = mappers[n.kind];
                if (mapFn) return mapFn(n);

                // TODO: mapFn may be undefined - need default tranversal then
                switch (n.kind) {
                    case 'ApplicationExpression': return {...n};
                    case 'Binding': return {...n};
                    case 'CharacterExpression': return {...n};
                    case 'Field': return {...n};
                    case 'FunctionExpression': return {...n};
                    case 'ImportExpression': return {...n};
                    case 'LabelExpression': return {...n};
                    case 'ListExpression': return {...n};
                    case 'Module': return {...n};
                    case 'ModuleExpression': return {...n};
                    case 'ModulePattern': return {...n};
                    case 'ModulePatternName': return {...n};
                    case 'Program': return {...n};
                    case 'RecordExpression': return {...n};
                    case 'ReferenceExpression': return {...n};
                    case 'SelectionExpression': return {...n};
                    case 'SequenceExpression': return {...n};
                    case 'SourceFile': return {...n};
                    case 'StaticMemberExpression': return {...n};
                    case 'StringExpression': return {...n};
                    case 'VariablePattern': return {...n};
                    default: ((_assertNoKindsLeft: never) => { throw new Error(`Unhandled kind ${n.kind}`); })(n.kind);
                }
            }
            catch (err) {
                err; // TODO: how to handle? May be better to let caller handle it?
            }
        };
        const mappers: any = mappings(rec);
        return rec(node);
    };
}


// TODO: doc...
type Mappings<N extends Node, Nᐟ extends Node, MapObj> =
    (rec: <SpecificNode extends N>(n: SpecificNode) => NodeOfKind<Nᐟ, SpecificNode['kind']>) => MapObj & {
        [K in keyof MapObj]: K extends Node['kind']
            ? (n: NodeOfKind<N, K>) => NodeOfKind<Nᐟ, K>
            : never
    };


/**
 * Helper type that narrows from the union of node types `N` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<N extends Node, K extends Node['kind']> = N extends {kind: K} ? N : never;
