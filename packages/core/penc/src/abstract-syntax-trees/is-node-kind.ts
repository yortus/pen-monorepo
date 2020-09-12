import type {NodeKind} from './node-kinds';
import type {Node} from './nodes';


export function isNodeKind<K extends NodeKind>(node: Node, k: readonly K[]): node is Node extends infer N ? (N extends {kind: K} ? N : never) : never {
    return k.includes(node.kind as any);
}
