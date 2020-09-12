import type {Node} from '../nodes';


/** An array of node kinds, with utility methods attached. */
export type NodeKinds<K extends Node['kind']> = K[] & {

    /** Returns true if `node` belongs to the set of node kinds. Also acts as a static type guard. */
    includes: <N extends Node>(node: N) => node is N extends {kind: K} ? N : never;

    /** Returns a new array of node kinds that excludes the given kinds. */
    without: <X extends K>(...excluded: X[]) => NodeKinds<Exclude<K, X>>;
}
