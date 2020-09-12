import type {Node} from '../nodes';
import type {NodeKinds} from './node-kinds';


/** Returns an array of the given node kinds, with utility methods attached. */
export function createNodeKinds<K extends Node['kind']>(...kinds: K[]): NodeKinds<K> {
    return Object.assign(kinds, {
        includes<N extends Node>(node: N): node is N extends {kind: K} ? N : never {
            return Array.prototype.includes.call(kinds, node.kind);
        },
        without<X extends K>(...excluded: X[]) {
            let result = kinds.filter(k => !excluded.includes(k as any));
            return createNodeKinds(...result as Array<Exclude<K, X>>);
        },
    });
}
