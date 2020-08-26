import {NodeKind} from '../../ast-nodes';
import {Binding} from './binding';
import {Expression} from './expression';
import {Module, ModuleMap} from './module';
import {FilterKinds} from './util';


export type Node<KS extends NodeKind = NodeKind> = FilterKinds<KS,
    | Binding<KS>
    | Expression<KS>
    | Module<KS>
    | ModuleMap<KS>
>;
