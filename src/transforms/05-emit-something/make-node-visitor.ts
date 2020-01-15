// TODO: move to utils...




// TODO: doc...
export function makeNodeVisitor<N extends {kind: string}>(getVisitors: GetVisitors<N>) {
    const rec = (...childNodes: N[]): void => childNodes.forEach(n => visitors[n.kind](n));
    const visitors: any = getVisitors(rec);
    return rec;
}


// TODO: doc...
type GetVisitors<N extends {kind: string}> =
    (rec: (...childNodes: N[]) => void) => {
        [K in N extends {kind: infer U} ? U : never]: (n: NodeOfKind<N, K>) => void
    };


/**
 * Helper type that narrows from the union of node types `N` to the
 * single node type corresponding to the node kind given by `K`.
 */
type NodeOfKind<N extends {kind: string}, K extends N['kind']> = N extends {kind: K} ? N : never;
