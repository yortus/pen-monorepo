// TODO: doc...
export function makeNodeMapper<N extends {kind: string}, Nᐟ extends {kind: string}>(getMappers: GetMappers<N, Nᐟ>) {
    const rec: <NN extends N>(n: NN) => NodeOfKind<Nᐟ, NN['kind']> = n => {
        try {
            return mappers[n.kind](n);
        }
        catch (err) {
            err;
        }
    };
    const mappers: any = getMappers(rec);
    return rec;
}


// TODO: doc...
type GetMappers<N extends {kind: string}, Nᐟ extends {kind: string}> =
    (rec: <NN extends N>(n: NN) => NodeOfKind<Nᐟ, NN['kind']>) => {
        [K in N extends {kind: infer U} ? U : never]?: (n: NodeOfKind<N, K>) => NodeOfKind<Nᐟ, K>
    };


/**
 * Helper type that narrows from the union of node types `N` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<N extends {kind: string}, K extends N['kind']> = N extends {kind: K} ? N : never;
