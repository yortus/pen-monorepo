import type {Node} from '../nodes';


export type NodeKinds<K extends Node['kind']> = K[] & {
    includes: <N extends Node>(node: N) => node is N extends {kind: K} ? N : never;
    without: <X extends K>(...excluded: X[]) => NodeKinds<Exclude<K, X>>;
}
