import {AbsPath} from '../utils';
import {AbstractSyntaxTree, NodeKind} from '../abstract-syntax-trees';


export interface ResolvedProgram {
    readonly kind: 'ResolvedProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
    readonly startGlobalName: string;
}


export type ResolvedNodeKind = Exclude<NodeKind, ExcludedResolvedNode>;
export const ResolvedNodeKind = NodeKind.filter(k => !ExcludedResolvedNode.includes(k as any)) as ResolvedNodeKind[];


type ExcludedResolvedNode = typeof ExcludedResolvedNode[any];
const ExcludedResolvedNode = [
    'LocalBinding',
    'LocalMultiBinding',
    'LocalReferenceExpression',
    'ParenthesisedExpression',
] as const;
