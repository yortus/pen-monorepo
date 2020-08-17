import {NodeKind} from '../../ast-nodes';
import {AbsPath} from '../../utils';
import {Binding} from './binding';


export interface Module<KS extends NodeKind = NodeKind> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<KS>>;
    readonly path?: AbsPath;
}
