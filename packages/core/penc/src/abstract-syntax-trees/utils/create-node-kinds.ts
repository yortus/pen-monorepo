import type {Node} from '../nodes';
import type {NodeKinds} from './node-kinds';


export function createNodeKinds<K extends Node['kind']>(...kinds: K[]): NodeKinds<K> {

    function includes<N extends Node>(node: N): node is N extends {kind: K} ? N : never {
        return kinds.includes(node.kind as any);
    }

    function without<X extends K>(...excluded: X[]) {
        let result = kinds.filter(k => !excluded.includes(k as any));
        return createNodeKinds(...result as Array<Exclude<K, X>>);
    }
    return Object.assign([] as K[], kinds, {includes, without});
}
