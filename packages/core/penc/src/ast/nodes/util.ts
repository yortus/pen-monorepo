import {NodeKind} from '../../ast-nodes';


export type FilterKinds<KS extends NodeKind, N> = N extends {kind: KS} ? N : never;
