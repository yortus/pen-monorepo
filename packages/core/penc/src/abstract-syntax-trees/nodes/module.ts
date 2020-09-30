import type {AbsPath} from '../../utils';
import type {Expression} from './expression';
import type {Pattern} from './pattern';


/** An AST node type representing a PEN module. */
export interface Module {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<{
        readonly pattern: Pattern;
        readonly value: Expression;
        readonly exported: boolean;
    }>;
    readonly path?: AbsPath;
}
