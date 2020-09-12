import {AbsPath} from '../utils';
import {AbstractSyntaxTree, allNodeKinds} from '../abstract-syntax-trees';


/**
 * PEN AST with simple node-level desugaring transformations applied, in order to reduce the number of node kinds
 * that later AST transforms need to deal with. In particular:
 * - each LocalMultiBinding node is replaced with 0..M LocalBinding nodes
 * - each ParenthesisedExpression node is replaced with the node it refers to.
 */
export interface DesugaredProgram {
    readonly kind: 'DesugaredProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
}


/** List of node kinds that may be present in a DesugaredProgram AST. */
export const desugaredNodeKinds = allNodeKinds.without(
    'GlobalBinding',
    'GlobalReferenceExpression',
    'LocalMultiBinding',
    'ParenthesisedExpression',
);
