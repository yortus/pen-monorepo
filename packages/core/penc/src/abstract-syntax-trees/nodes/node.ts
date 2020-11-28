import type {Definition} from './definition';
import type {Expression} from './expression';
import type {Module, ModuleStub} from './module';
import type {Pattern} from './pattern';
import type {SourceFile} from './source-file';


/** Union of all possible node types that may occur in a PEN AST. */
export type Node =
    | Definition
    | Expression
    | Module
    | ModuleStub
    | Pattern
    | SourceFile
;
