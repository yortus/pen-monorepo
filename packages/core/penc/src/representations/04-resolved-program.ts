import {AbsPath} from '../utils';
import {AbstractSyntaxTree, NodeKind} from '../abstract-syntax-trees';


export interface ResolvedProgram {
    readonly sourceFiles: ResolvedAst;
    readonly mainPath: AbsPath;
    readonly startGlobalName: string;
}


export type ResolvedAst = AbstractSyntaxTree<Exclude<NodeKind,
    | 'LocalBinding'
    | 'LocalMultiBinding'
    | 'LocalReferenceExpression'
    | 'ParenthesisedExpression'
>>;
