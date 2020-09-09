import type {NodeKind} from './node-kind';
import type {Node} from './nodes';


export function assertNodeKind<K extends NodeKind>(node: Node, k: readonly K[]): asserts node is Node extends infer N ? (N extends {kind: K} ? N : never) : never {
    if (k.includes(node.kind as any)) return;
    throw new Error(`Unexpected node kond '${node.kind}'. Expected one of: '${k.join(`', '`)}'`);
}
