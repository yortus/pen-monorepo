import {AbsPath} from '../utils';
import {AbstractSyntaxTree, createNodeKind} from '../abstract-syntax-trees';


export interface DesugaredProgram {
    readonly kind: 'DesugaredProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
}


export const DesugaredNodeKind = createNodeKind({
    exclude: [
        'GlobalBinding',
        'GlobalReferenceExpression',
        'LocalMultiBinding',
        'ParenthesisedExpression',
    ],
});
