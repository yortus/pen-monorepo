import type {AbsPath} from '../../utils';
import type {Module} from './module';


/** The root node type of a PEN AST. */
export interface AbstractSyntaxTree {
    readonly kind: 'AbstractSyntaxTree';
    readonly modulesByAbsPath: ReadonlyMap<AbsPath, Module>;
}
