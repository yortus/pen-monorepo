import type {Expression} from './expression';


// TODO: jsdoc...
export interface Definition {
    readonly kind: 'Definition';
    readonly id: number;
    readonly localName: string; // maybe???
    readonly globalName: string; // maybe???
    readonly expression: Expression;
}
