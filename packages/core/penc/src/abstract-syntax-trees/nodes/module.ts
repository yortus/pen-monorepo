import type {AbsPath} from '../../utils';
import type {NodeKind} from '../node-kind';
import type {Binding} from './binding';


export interface Module<KS extends NodeKind = NodeKind> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<KS>>;
    readonly path?: AbsPath;
}
