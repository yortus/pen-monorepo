import type {AbsPath} from '../../utils';
import type {Binding} from './binding';
import type {NodeKind} from './node-kind';


export interface Module<KS extends NodeKind = NodeKind> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<KS>>;
    readonly path?: AbsPath;
}
