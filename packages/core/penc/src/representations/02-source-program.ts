import {AbsPath} from '../utils';
import {AbstractSyntaxTree, allNodeKinds} from '../abstract-syntax-trees';


/** Initial AST of a PEN program. */
export interface SourceProgram {
    readonly kind: 'SourceProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
}


/** List of node kinds that may be present in a SourceProgram AST. */
export const sourceNodeKinds = allNodeKinds.without(
    'GlobalBinding',
    'ReferenceExpression',
);
