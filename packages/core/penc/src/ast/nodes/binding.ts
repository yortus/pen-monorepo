import {NodeKind} from '../../ast-nodes';
import {Expression} from './expression';
import {FilterKinds} from './util';


export type Binding<KS extends NodeKind = NodeKind> = FilterKinds<KS,
    | SimpleBinding<KS>
    | UnresolvedDestructuredBinding<KS>
    | UnresolvedSimpleBinding<KS>
>;


export interface SimpleBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'SimpleBinding';
    readonly name: string;
    readonly value: Expression<KS>;
    readonly exported: boolean;
    readonly symbolId: string;
}


export interface UnresolvedDestructuredBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'UnresolvedDestructuredBinding';
    readonly names: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
    readonly value: Expression<KS>;
    readonly exported: boolean;
}


export interface UnresolvedSimpleBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'UnresolvedSimpleBinding';
    readonly name: string;
    readonly value: Expression<KS>;
    readonly exported: boolean;
}
