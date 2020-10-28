import type {AbsPath} from '../../utils';
import type {Binding} from './binding';


/** An AST node type representing a PEN module. */
export interface Module {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding>;
    readonly path?: AbsPath;
}
