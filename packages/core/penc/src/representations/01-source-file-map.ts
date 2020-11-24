import {allNodeKinds, SourceFile} from '../abstract-syntax-trees';


/** A PEN program expressed as a mapping from absolute paths to `SourceFile` AST nodes. */
export interface SourceFileMap {
    readonly sourceFilesByPath: Record<string, SourceFile>;
    readonly startPath: string;
}


/** List of node kinds that may be present in a SourceFileMap program representation. */
export const sourceFileMapKinds = allNodeKinds.without(
    'Definition',
    'Module',
    'ModuleStub',
    'Reference',
    // TODO: others? check...
);
