import type {Expression} from './expression';
import type {Pattern} from './pattern';


// TODO: jsdoc...
export interface Binding {
    readonly kind: 'Binding';
    readonly pattern: Pattern;
    readonly value: Expression;
    readonly exported: boolean;
}
