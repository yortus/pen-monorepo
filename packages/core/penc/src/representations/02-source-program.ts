import {AbsPath} from '../utils';
import {AbstractSyntaxTree, NodeKind} from '../abstract-syntax-trees';


export interface SourceProgram {
    readonly kind: 'SourceProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
}


export type SourceNodeKind = Exclude<NodeKind, ExcludedSourceNode>;
export const SourceNodeKind = NodeKind.filter(k => !ExcludedSourceNode.includes(k as any)) as SourceNodeKind[];


type ExcludedSourceNode = typeof ExcludedSourceNode[any];
const ExcludedSourceNode = [
    'GlobalBinding',
    'GlobalReferenceExpression',
] as const;
