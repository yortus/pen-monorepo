import {AbstractSyntaxTree} from './abstract-syntax-tree';
import {Binding} from './binding';
import {Expression} from './expression';
import {Module} from './module';
import {NodeKind} from './node-kind';
import {FilterKinds} from './util';


export type Node<KS extends NodeKind = NodeKind> = FilterKinds<KS,
    | AbstractSyntaxTree<KS>
    | Binding<KS>
    | Expression<KS>
    | Module<KS>
>;
