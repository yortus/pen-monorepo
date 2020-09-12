import type {NodeKind} from './node-kinds';
import type {Node} from './nodes';


export function assertNodeKind<K extends NodeKind>(node: Node, k: readonly K[]): asserts node is Node extends infer N ? (N extends {kind: K} ? N : never) : never {
    if (k.includes(node.kind as any)) return;
    throw new Error(`Unexpected node kind '${node.kind}'. Expected one of: '${k.join(`', '`)}'`);
}
