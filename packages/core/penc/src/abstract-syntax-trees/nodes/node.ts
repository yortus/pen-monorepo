import type {AbstractSyntaxTree} from './abstract-syntax-tree';
import {Expression} from './expression';
import type {Module} from './module';
import {Pattern} from './pattern';


/** Union of all possible node types that may occur in a PEN AST. */
export type Node =
    | AbstractSyntaxTree
    | Expression
    | Module
    | Pattern
;
