import type {Binding} from './binding';
import type {Definition} from './definition';
import type {Expression} from './expression';
import type {File} from './file';
import type {Module} from './module';
import type {Pattern} from './pattern';


/** Union of all possible node types that may occur in a PEN AST. */
export type Node =
    | Binding
    | Definition
    | Expression
    | File
    | Module
    | Pattern
;
