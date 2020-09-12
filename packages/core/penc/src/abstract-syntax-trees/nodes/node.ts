import type {AbstractSyntaxTree} from './abstract-syntax-tree';
import {Binding} from './binding';
import {Expression} from './expression';
import type {Module} from './module';


/** Union of all possible node types that may occur in a PEN AST. */
export type Node =
    | AbstractSyntaxTree
    | Binding
    | Expression
    | Module
;
