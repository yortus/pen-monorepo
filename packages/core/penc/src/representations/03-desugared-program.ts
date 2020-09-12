import {AbsPath} from '../utils';
import {AbstractSyntaxTree, allNodeKinds} from '../abstract-syntax-trees';


export interface DesugaredProgram {
    readonly kind: 'DesugaredProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
}


export const desugaredNodeKinds = allNodeKinds.without(
    'GlobalBinding',
    'GlobalReferenceExpression',
    'LocalMultiBinding',
    'ParenthesisedExpression',
);
