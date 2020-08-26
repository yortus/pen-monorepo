import {Binding} from './binding';
import {Expression} from './expression';
import {Module, ModuleMap} from './module';
import {NodeKind} from './node-kind';
import {FilterKinds} from './util';


export type Node<KS extends NodeKind = NodeKind> = FilterKinds<KS,
    | Binding<KS>
    | Expression<KS>
    | Module<KS>
    | ModuleMap<KS>
>;
