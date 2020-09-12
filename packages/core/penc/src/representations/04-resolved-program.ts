import {AbsPath} from '../utils';
import {AbstractSyntaxTree, allNodeKinds} from '../abstract-syntax-trees';


export interface ResolvedProgram {
    readonly kind: 'ResolvedProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
    readonly startGlobalName: string;
}


export const resolvedNodeKinds = allNodeKinds.without(
    'LocalBinding',
    'LocalMultiBinding',
    'LocalReferenceExpression',
    'ParenthesisedExpression',
);
