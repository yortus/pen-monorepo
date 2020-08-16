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
const SourceDeletions = ['ResolvedBinding', 'ResolvedReferenceExpression'] as const;
const DesugaredDeletions = ['DestructuredBinding', 'ParenthesisedExpression', 'ResolvedBinding', 'ResolvedReferenceExpression'] as const;
const ResolvedDeletions = ['DestructuredBinding', 'ParenthesisedExpression', 'SimpleBinding', 'ReferenceExpression'] as const;

export type SourceNodeKind = Exclude<NodeKind, typeof SourceDeletions[any]>;
export type DesugaredNodeKind = Exclude<NodeKind, typeof DesugaredDeletions[any]>;
export type ResolvedNodeKind = Exclude<NodeKind, typeof ResolvedDeletions[any]>;

export const SourceNodeKind = NodeKind.filter((k: any) => !SourceDeletions.includes(k)) as SourceNodeKind[];
export const DesugaredNodeKind = NodeKind.filter((k: any) => !DesugaredDeletions.includes(k)) as DesugaredNodeKind[];
export const ResolvedNodeKind = NodeKind.filter((k: any) => !ResolvedDeletions.includes(k)) as ResolvedNodeKind[];