import type {AbsPath} from '../../utils';
import type {Binding} from './binding';


/** An AST node type representing a PEN source file. */
export interface File {
    readonly kind: 'File';
    readonly path: AbsPath;
    readonly bindings: ReadonlyArray<Binding>;
}
