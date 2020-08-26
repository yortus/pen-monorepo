import {Program} from './program';
import {Node, NodeKind} from '../ast-nodes';


// TODO: temp testing........
export * from './program';


// TODO: temp testing........
type NodeKindsFromProgram<P extends Program<any>> = P extends Program<infer KS> ? KS : never;
type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
type NodeFromProgram<P extends Program<any>, K extends NodeKind> = NodeFromNodeKind<NodeKindsFromProgram<P>, K>;


type MyProgram = Program<'ModuleMap' | 'Module' | 'LocalBinding' | 'StringLiteralExpression'>;
type Kinds1 = NodeKindsFromProgram<MyProgram>; //           ✓
type Module2 = NodeFromProgram<MyProgram, 'Module'>; //     ✓
[] = [] as any as [Kinds1, Module2];




// TODO: temp testing........
const SourceDeletions = [
    'GlobalBinding',
    'GlobalReferenceExpression',
] as const;
export type SourceNodeKind = Exclude<NodeKind, typeof SourceDeletions[any]>;
export const SourceNodeKind = NodeKind.filter((k: any) => !SourceDeletions.includes(k)) as SourceNodeKind[];

export interface SourceProgram extends Program<SourceNodeKind> {/***/}
