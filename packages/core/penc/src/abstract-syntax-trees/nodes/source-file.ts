import type {AbsPath} from '../../utils';
import {Binding} from './binding';


/** An AST node type representing a PEN source file. */
export interface SourceFile {
    readonly kind: 'SourceFile';
    readonly path: AbsPath;
    readonly bindings: ReadonlyArray<Binding>;
}
