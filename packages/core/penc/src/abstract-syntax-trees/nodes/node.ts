import type {Binding} from './binding';
import type {Definition} from './definition';
import type {Expression} from './expression';
import type {Module} from './module';
import type {Pattern} from './pattern';
import type {SourceFile} from './source-file';


/** Union of all possible node types that may occur in a PEN AST. */
export type Node =
    | Binding
    | Definition
    | Expression
    | Module
    | Pattern
    | SourceFile
;
