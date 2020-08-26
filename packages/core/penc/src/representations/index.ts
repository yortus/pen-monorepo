import {AbsPath} from '../utils';
import {Expression, Node, NodeKind} from './nodes';
import {Program} from './program';


// TODO: temp testing........
export * from './nodes';
export {Program} from './program';
export {SourceProgram} from './01-source-program';
export {DesugaredProgram} from './02-desugared-program';
export {ResolvedProgram} from './03-resolved-program';


// TODO: temp testing........
export type NodeKindsFromProgram<P extends Program<any>> = P extends Program<infer KS> ? KS : never;
type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
export type NodeFromProgram<P extends Program<any>, K extends NodeKind | 'Expression'> = NodeFromNodeKind<
    NodeKindsFromProgram<P>,
    K extends NodeKind ? K :
    K extends 'Expression' ? Expression['kind'] :
    never
>;
















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
