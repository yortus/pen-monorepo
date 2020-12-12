import type {Binding} from './binding';
import type {Expression} from './expression';
import type {Pattern} from './pattern';


/** Union of all possible node types that may occur in a PEN AST. */
export type Node =
    | Binding
    | Expression
    | Pattern
;
