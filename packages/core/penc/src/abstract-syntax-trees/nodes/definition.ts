import type {Expression} from './expression';


// TODO: jsdoc...
export interface Definition {
    readonly kind: 'Definition';
    readonly definitionId: number;
    readonly localName: string; // maybe???
    readonly globalName: string; // maybe???
    readonly expression: Expression;
}
