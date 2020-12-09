import {allNodeKinds, BindingList} from '../abstract-syntax-trees';


/**
 * A PEN program expressed as a mapping from an absolute file path
 * to the `BindingList` node for the corresponding source file.
 */
export interface SourceFileMap {
    /** Mapping from absolute file path to the BindingList node for the source file. */
    readonly sourceFilesByPath: Record<string, BindingList>;

    /** Absolute path to the main source file, whose 'start' binding represents the program entry point. */
    readonly startPath: string;
}


/** List of node kinds that may be present in a SourceFileMap program representation. */
export const sourceFileMapKinds = allNodeKinds.without(
    'Definition',
    'Module',
    'Reference',
);
