import type {V} from '../../representations';


/** An array of node kinds, with utility methods attached. */
export type NodeKinds<K extends V.Node<0>['kind']> = K[] & {

    /** Returns true if `node` belongs to the set of node kinds. Also acts as a static type guard. */
    matches: <N extends V.Node<0>>(node: N) => node is N extends {kind: K} ? N : never;

    /** Returns a new array of node kinds that excludes the given kinds. */
    without: <X extends K>(...excluded: X[]) => NodeKinds<Exclude<K, X>>;
}
