import type {V} from '../../representations';
import type {NodeKinds} from './node-kinds';


/** Returns an array of the given node kinds, with utility methods attached. */
export function createNodeKinds<K extends V.Node<0>['kind']>(...kinds: K[]): NodeKinds<K> {
    return Object.assign(kinds, {
        matches<N extends V.Node<0>>(node: N): node is N extends {kind: K} ? N : never {
            return Array.prototype.includes.call(kinds, node.kind);
        },
        without<X extends K>(...excluded: X[]) {
            const result = kinds.filter(k => !excluded.includes(k as any));
            return createNodeKinds(...result as Array<Exclude<K, X>>);
        },
    });
}
