import {Node, NodeKind, Program} from '../ast-nodes';
import {AbsPath} from '../utils';


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
export type SourceNodes = Node<NodeKind>;
export type DesugaredNodes = Node<Exclude<NodeKind, 'DestructuredBinding' | 'ParenthesisedExpression'>>;
export type ResolvedNodes = DesugaredNodes;

export type SourceProgram = Program<SourceNodes['kind']>;
export type DesugaredProgram = Program<DesugaredNodes['kind']>;
export type ResolvedProgram = Program<ResolvedNodes['kind']>;
