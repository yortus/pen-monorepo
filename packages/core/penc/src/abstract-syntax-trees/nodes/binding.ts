import type {Expression} from './expression';
import type {Pattern} from './pattern';


// TODO: jsdoc...
export interface Binding {
    readonly kind: 'Binding';
    readonly left: Pattern;
    readonly right: Expression;
    readonly exported: boolean;
}
