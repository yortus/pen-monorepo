import {NodeKind} from '../ast-nodes';
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
export type SourceNodeKind = NodeKind;
export type DesugaredNodeKind = Exclude<NodeKind, 'DestructuredBinding' | 'ParenthesisedExpression'>;
export type ResolvedNodeKind = DesugaredNodeKind;
