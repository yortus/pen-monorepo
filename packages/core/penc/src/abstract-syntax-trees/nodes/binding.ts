import type {Expression} from './expression';


/** Union of all node types that bind names to expressions. */
export type Binding =
    | GlobalBinding
    | LocalBinding
    | LocalMultiBinding
;


export interface GlobalBinding {
    readonly kind: 'GlobalBinding';
    readonly localName: string;
    readonly globalName: string;
    readonly value: Expression;
    readonly exported: boolean;
}


export interface LocalBinding {
    readonly kind: 'LocalBinding';
    readonly localName: string;
    readonly value: Expression;
    readonly exported: boolean;
}


export interface LocalMultiBinding {
    readonly kind: 'LocalMultiBinding';
    readonly names: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
    readonly value: Expression;
    readonly exported: boolean;
}
