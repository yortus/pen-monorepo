import {AbsPath} from '../utils';
import {AbstractSyntaxTree, allNodeKinds} from '../abstract-syntax-trees';


/**
 * PEN AST with all Local* node kinds replaced with Global* equivalents. All references in the program
 * have been resolved using AST-global names that directly link references with their referents.
 */
export interface ResolvedProgram {
    readonly kind: 'ResolvedProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
    readonly startGlobalName: string;
}


/** List of node kinds that may be present in a ResolvedProgram AST. */
export const resolvedNodeKinds = allNodeKinds.without(
    'LocalBinding',
    'LocalMultiBinding',
    'LocalReferenceExpression',
    'ParenthesisedExpression',
);
