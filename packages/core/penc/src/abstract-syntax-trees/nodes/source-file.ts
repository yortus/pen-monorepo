import type {AbsPath} from '../../utils';
import type {Expression, Identifier} from './expression';
import type {Pattern} from './pattern';


/** An AST node type representing a PEN source file. */
export interface SourceFile {
    readonly kind: 'SourceFile';
    readonly path: AbsPath;
    readonly bindings: ReadonlyArray<{
        readonly left: Identifier | Pattern;
        readonly right: Expression;
    }>;
}
