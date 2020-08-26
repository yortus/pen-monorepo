import {Node, NodeKind} from '../../ast-nodes';
import {AbsPath} from '../../utils';
import {Module} from './module';


export interface Program<KS extends NodeKind = NodeKind> {
    readonly kind: 'Program';
    readonly sourceFiles: ReadonlyMap<AbsPath, Module<KS>>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}




// TODO: temp testing........
type NodeKindsFromProgram<P extends Program<any>> = P extends Program<infer KS> ? KS : never;
type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
type NodeFromProgram<P extends Program<any>, K extends NodeKind> = NodeFromNodeKind<NodeKindsFromProgram<P>, K>;



type MyProgram = Program<'Program' | 'Module' | 'LocalBinding' | 'StringLiteralExpression'>;
type Kinds1 = NodeKindsFromProgram<MyProgram>; //           ✓
type Module2 = NodeFromProgram<MyProgram, 'Module'>; //     ✓
[] = [] as any as [Kinds1, Module2];

// So representations can each be a RepNameProgram<KS> type
// - export from where?
// - one per file, or all in one representations.ts file?
// - program.ts or representation.ts
