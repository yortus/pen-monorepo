import type {NodeKind} from './node-kind';


export function assertNodeKind<K extends NodeKind>(kind: NodeKind, k: K[]): asserts kind is K {
    if (k.includes(kind as any)) return;
    throw new Error(`${kind} is not in [${k.join(', ')}]`);
}
