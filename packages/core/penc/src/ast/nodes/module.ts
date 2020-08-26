import {NodeKind} from '../../ast-nodes';
import {AbsPath} from '../../utils';
import {Binding} from './binding';


export interface Module<KS extends NodeKind = NodeKind> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<KS>>;
    readonly path?: AbsPath;
}


export interface ModuleMap<KS extends NodeKind = NodeKind> {
    readonly kind: 'ModuleMap';
    readonly byAbsPath: ReadonlyMap<AbsPath, Module<KS>>;
}
