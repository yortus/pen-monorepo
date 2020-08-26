import {AbsPath} from '../utils';
import {Node} from './nodes';
import {NodeKind} from './node-kind';
import {Program} from './program';


// TODO: temp testing........
export * from './nodes';
export * from './node-kind';
export * from './program';


// TODO: temp testing........
export type NodeKindsFromProgram<P extends Program<any>> = P extends Program<infer KS> ? KS : never;
export type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
export type NodeFromProgram<P extends Program<any>, K extends NodeKind> = NodeFromNodeKind<NodeKindsFromProgram<P>, K>;


// TODO: remove these...
type MyProgram = Program<'ModuleMap' | 'Module' | 'LocalBinding' | 'StringLiteralExpression'>;
type Kinds1 = NodeKindsFromProgram<MyProgram>; //           ✓
type Module2 = NodeFromProgram<MyProgram, 'Module'>; //     ✓
[] = [] as any as [Kinds1, Module2];




// TODO: temp testing........
export interface SourceProgram extends Program<SourceNodeKind> {/***/}
export interface DesugaredProgram extends Program<DesugaredNodeKind> {/***/}
export interface ResolvedProgram extends Program<ResolvedNodeKind> {/***/}

export type SourceModule = NodeFromProgram<SourceProgram, 'Module'>;
















// TODO: ...
export interface SourceFileGraph {
    sourceFiles: Map<AbsPath, SourceFileInfo>;
    mainPath: AbsPath;
}


// TODO: ...
export interface SourceFileInfo {

    /** The source file's normalised absolute path. */
    readonly path: AbsPath;

    /**
     * A map with one entry for each import expression in this source file. The keys are the imported module
     * specifiers, exactly as they appear in the source text. The values are the normalised absolute paths of
     * the corresponding imported SourceFiles.
     */
    readonly imports: {[moduleSpecifier: string]: AbsPath};
}


// TODO: ...
const SourceDeletions = [
    'GlobalBinding',
    'GlobalReferenceExpression',
] as const;
const DesugaredDeletions = [
    'GlobalBinding',
    'GlobalReferenceExpression',
    'LocalMultiBinding',
    'ParenthesisedExpression',
] as const;
const ResolvedDeletions = [
    'LocalBinding',
    'LocalMultiBinding',
    'LocalReferenceExpression',
    'ParenthesisedExpression',
] as const;

// TODO: don't export these... but first need to change mapAst signature to do so
export type SourceNodeKind = Exclude<NodeKind, typeof SourceDeletions[any]>;
export type DesugaredNodeKind = Exclude<NodeKind, typeof DesugaredDeletions[any]>;
export type ResolvedNodeKind = Exclude<NodeKind, typeof ResolvedDeletions[any]>;

export const SourceNodeKind = NodeKind.filter((k: any) => !SourceDeletions.includes(k)) as SourceNodeKind[];
export const DesugaredNodeKind = NodeKind.filter((k: any) => !DesugaredDeletions.includes(k)) as DesugaredNodeKind[];
export const ResolvedNodeKind = NodeKind.filter((k: any) => !ResolvedDeletions.includes(k)) as ResolvedNodeKind[];
