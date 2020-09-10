import {AbsPath} from '../utils';
import {createNodeKind, AbstractSyntaxTree} from '../abstract-syntax-trees';


export interface SourceProgram {
    readonly kind: 'SourceProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
}


export const SourceNodeKind = createNodeKind({exclude: ['GlobalBinding', 'GlobalReferenceExpression']});
