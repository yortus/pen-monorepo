import {AbsPath} from '../utils';
import {AbstractSyntaxTree, NodeKind} from '../abstract-syntax-trees';


export interface DesugaredProgram {
    readonly sourceFiles: DesugaredAst;
    readonly mainPath: AbsPath;
}


export type DesugaredAst = AbstractSyntaxTree<Exclude<NodeKind,
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
    | 'LocalMultiBinding'
    | 'ParenthesisedExpression'
>>;
