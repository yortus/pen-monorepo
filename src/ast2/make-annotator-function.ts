import {AstVersion, Node, NodeFromKind, NodeKind} from './type-operators';


export function makeAnnotatorFunction<V extends AstVersion, Vᐟ extends AstVersion>(getFns: AnnotatorFunctions<V, Vᐟ>) {
    const recurse: any = (node: any) => fns[node.kind](node);
    let fns = getFns(recurse) as any;
    return recurse as <N extends Node<V>>(node: N) => NodeUpgrade<V, Vᐟ, N>;
}


/** Describes an object whose keys are node kinds and whose values are node transform functions. */
export type AnnotatorFunctions<V extends AstVersion, Vᐟ extends AstVersion> = (
//    recurse: <N extends Node<V>>(node: N) => NodeFromKind<Vᐟ, KindFromNode<N>>
    recurse: <N extends Node<V>>(node: N) => NodeUpgrade<V, Vᐟ, N>
) => {[K in NodeKind]: (node: NodeFromKind<V, K>) => NodeFromKind<Vᐟ, K>};




// Is this megaslow?
// NodeFromKind<Vᐟ, KindFromNode<N>>

// Better way?
// export type NodeFromKind<V extends AstVersion, K extends NodeKind>
//     = K extends keyof Ast<V> ? Ast<V>[K] : never;

// export type KindFromNode<N> = N extends {kind: infer U} ? U extends NodeKind ? U : never : never;

export type NodeUpgrade<V extends AstVersion, Vᐟ extends AstVersion, N extends Node<V>>
    = N extends {kind: infer U} ? U extends NodeKind ? NodeFromKind<Vᐟ, U> : never : never;
