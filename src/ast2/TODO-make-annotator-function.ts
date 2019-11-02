// import {Node} from './node';
// import {NodeKind} from './node-kind';
// import {NodeVersion} from './node-version';


// export function annotateAst<N extends Node<NodeVersion>, Vᐟ extends NodeVersion>(
//     node: N,
//     _vᐟ: Vᐟ,
//     getFns: AnnotatorFunctions<N['meta']['version'], Vᐟ>
// ): Node<Vᐟ, N['kind']> {
//     let fns: any = getFns(n => fns[n.kind](n));
//     return fns[node.kind](node);
// }


// /** Describes an object whose keys are node kinds and whose values are node transform functions. */
// export type AnnotatorFunctions<V extends NodeVersion, Vᐟ extends NodeVersion> = (
// //    recurse: <N extends Node<V>>(node: N) => NodeFromKind<Vᐟ, KindFromNode<N>>
//     recurse: <N extends Node<V>, K extends NodeKind = N['kind'] > (node: N) => Node<Vᐟ, K>
// ) => {[K in NodeKind]: (node: Node<V, K>) => Node<Vᐟ, K>};
