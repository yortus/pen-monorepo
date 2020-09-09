import type {AbsPath} from '../../utils';
import type {Binding} from './binding';


export interface Module {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding>;
    readonly path?: AbsPath;
}
