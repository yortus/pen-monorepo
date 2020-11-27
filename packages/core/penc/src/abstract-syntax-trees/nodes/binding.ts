import type {Expression, Identifier} from './expression';
import type {Pattern} from './pattern';


// TODO: jsdoc...
export interface Binding {
    readonly kind: 'Binding';
    readonly left: Identifier | Pattern;
    readonly right: Expression;
}
