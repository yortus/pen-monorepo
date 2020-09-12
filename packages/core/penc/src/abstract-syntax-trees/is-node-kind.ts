import type {Node} from './nodes';


export function isNodeKind<N extends Node, K extends Node['kind']>(node: N, k: readonly K[]): node is N extends {kind: K} ? N : never {
    return k.includes(node.kind as any);
}
