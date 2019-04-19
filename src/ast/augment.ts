// TODO: this whole file temp testing...
import {Module} from './node-types';



type Pass1Ast = Augment<Module, {
    Definition: {extra: 42},
}>;
let ast!: Pass1Ast;
if (ast.kind === 'PenModule') {
    let decl = ast.declarations[0];
    if (decl.kind === 'Definition') {
        let def = decl;
        def.name;
        def.extra;
    }
    else {
        decl.bindings;
    }
}




export function augment<N extends {kind: string}, V extends Visitors<N>>(ast: N, visitors: V) {
    [] = [ast, visitors];
//    let result!: Augment<N, V>;
    
}

type Visitors<N extends {kind: string}> = {
    [K in N['kind']]?: {
        enter: (n: N extends {kind: K} ? N : never) => void;
        leave: (n: N extends {kind: K} ? N : never) => void;
    }
};






type Augment<T, NewProps extends {[K in string]: {}}> =
    // If T is a node type, produce the augmented node type.
    // If T is a union of node types, produce the union of augmented node types.
    T extends {kind: string} ? AugmentDeep<T & NewProps[T['kind']], NewProps> :
    // For any other N, leave it unchanged
    T;

// doc... N is a single node type. Map over its properties, augmenting them recursively.
type AugmentDeep<N extends {kind: string}, NewProps extends {[K in string]: {}}> = {
    [K in keyof N]:
        N[K] extends Array<infer E1> ? Array<Augment<E1, NewProps>> :
        N[K] extends ReadonlyArray<infer E1> ? ReadonlyArray<Augment<E1, NewProps>> :
        Augment<N[K], NewProps>;
};
