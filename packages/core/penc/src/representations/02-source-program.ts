import {AbsPath} from '../utils';
import {AbstractSyntaxTree, allNodeKinds} from '../abstract-syntax-trees';


export interface SourceProgram {
    readonly kind: 'SourceProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
}


export const sourceNodeKinds = allNodeKinds.without(
    'GlobalBinding',
    'GlobalReferenceExpression',
);
