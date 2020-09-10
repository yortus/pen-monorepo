import {AbsPath} from '../utils';
import {AbstractSyntaxTree, createNodeKind} from '../abstract-syntax-trees';


export interface ResolvedProgram {
    readonly kind: 'ResolvedProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
    readonly startGlobalName: string;
}


export const ResolvedNodeKind = createNodeKind({
    exclude: [
        'LocalBinding',
        'LocalMultiBinding',
        'LocalReferenceExpression',
        'ParenthesisedExpression',
    ],
});
