import {AbsPath} from '../utils';
import {AbstractSyntaxTree, NodeKind} from '../abstract-syntax-trees';


export interface SourceProgram {
    readonly sourceFiles: SourceAst;
    readonly mainPath: AbsPath;
}


export type SourceAst = AbstractSyntaxTree<Exclude<NodeKind,
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
>>;
