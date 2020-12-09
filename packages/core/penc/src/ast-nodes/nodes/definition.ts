import type {Expression} from './expression';


// TODO: jsdoc...
export interface Definition {
    readonly kind: 'Definition';
    readonly definitionId: string; // TODO: doc... can be used as an identifier; unique across program
    readonly localName: string;
    readonly value: Expression;
}
