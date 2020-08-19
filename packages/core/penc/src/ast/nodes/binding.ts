import {NodeKind} from '../../ast-nodes';
import {Expression} from './expression';
import {FilterKinds} from './util';


export type Binding<KS extends NodeKind = NodeKind> = FilterKinds<KS,
    | GlobalBinding<KS>
    | LocalBinding<KS>
    | LocalMultiBinding<KS>
>;


export interface GlobalBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'GlobalBinding';
    readonly localName: string;
    readonly globalName: string;
    readonly value: Expression<KS>;
    readonly exported: boolean;
}


export interface LocalBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'LocalBinding';
    readonly localName: string;
    readonly value: Expression<KS>;
    readonly exported: boolean;
}


export interface LocalMultiBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'LocalMultiBinding';
    readonly names: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
    readonly value: Expression<KS>;
    readonly exported: boolean;
}
