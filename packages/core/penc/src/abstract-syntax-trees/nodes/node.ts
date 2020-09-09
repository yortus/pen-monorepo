import type {AbstractSyntaxTree} from './abstract-syntax-tree';
import {Binding} from './binding';
import {Expression} from './expression';
import type {Module} from './module';


export type Node =
    | AbstractSyntaxTree
    | Binding
    | Expression
    | Module
;
