import {AbsPath} from '../../utils';
import {Binding} from './binding';
import {NodeKind} from './node-kind';


export interface Module<KS extends NodeKind = NodeKind> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<KS>>;
    readonly path?: AbsPath;
}


export interface ModuleMap<KS extends NodeKind = NodeKind> {
    readonly kind: 'ModuleMap';
    readonly modulesByAbsPath: ReadonlyMap<AbsPath, Module<KS>>;
}
