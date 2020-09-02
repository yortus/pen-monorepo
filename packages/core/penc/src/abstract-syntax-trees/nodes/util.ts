import {NodeKind} from './node-kind';


export type FilterKinds<KS extends NodeKind, N extends {kind: NodeKind}> = N extends {kind: KS} ? N : never;
