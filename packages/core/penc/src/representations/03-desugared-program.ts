import {AbsPath} from '../utils';
import {AbstractSyntaxTree, NodeKind} from '../abstract-syntax-trees';


export interface DesugaredProgram {
    readonly kind: 'DesugaredProgram';
    readonly sourceFiles: AbstractSyntaxTree;
    readonly mainPath: AbsPath;
}


export type DesugaredNodeKind = Exclude<NodeKind, ExcludedDesugaredNode>;
export const DesugaredNodeKind = NodeKind.filter(k => !ExcludedDesugaredNode.includes(k as any)) as DesugaredNodeKind[];


type ExcludedDesugaredNode = typeof ExcludedDesugaredNode[any];
const ExcludedDesugaredNode = [
    'GlobalBinding',
    'GlobalReferenceExpression',
    'LocalMultiBinding',
    'ParenthesisedExpression',
] as const;
