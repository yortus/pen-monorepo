import {NodeKind} from './node-kind';


export type FilterKinds<KS extends NodeKind, N> = N extends {kind: KS} ? N : never;
