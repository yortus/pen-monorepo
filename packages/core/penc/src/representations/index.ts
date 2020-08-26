import {AbsPath} from '../utils';
import {Expression, Node, NodeKind} from './nodes';
import {Program} from './program';


// TODO: temp testing........
export * from './nodes';
export {Program} from './program';


// TODO: temp testing........
export type NodeKindsFromProgram<P extends Program<any>> = P extends Program<infer KS> ? KS : never;
type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
export type NodeFromProgram<P extends Program<any>, K extends NodeKind | 'Expression'> = NodeFromNodeKind<
    NodeKindsFromProgram<P>,
    K extends NodeKind ? K :
    K extends 'Expression' ? Expression['kind'] :
    never
>;


// TODO: temp testing........
export interface SourceProgram extends Program<SourceNodeKind> {/***/}
export interface DesugaredProgram extends Program<DesugaredNodeKind> {/***/}
export interface ResolvedProgram extends Program<ResolvedNodeKind> {/***/}
















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
type SourceExclusions =
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
;
type DesugaredExclusions =
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
    | 'LocalMultiBinding'
    | 'ParenthesisedExpression'
;
type ResolvedExclusions =
    | 'LocalBinding'
    | 'LocalMultiBinding'
    | 'LocalReferenceExpression'
    | 'ParenthesisedExpression'
;

// TODO: don't export these... but first need to change mapAst signature to do so
type SourceNodeKind = Exclude<NodeKind, SourceExclusions>;
type DesugaredNodeKind = Exclude<NodeKind, DesugaredExclusions>;
type ResolvedNodeKind = Exclude<NodeKind, ResolvedExclusions>;
