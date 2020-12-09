import {allNodeKinds, BindingList} from '../abstract-syntax-trees';
import {AbsPath} from '../utils';


/** A PEN program expressed as a forest of source file ASTs. */
export interface SourceFileMap {
    /** Mapping from absolute source file path to the BindingList node for the source file. */
    readonly sourceFilesByPath: Record<string, BindingList>;

    /** Absolute path to the main source file, whose 'start' binding represents the program entry point. */
    readonly startPath: AbsPath;
}


/** List of node kinds that may be present in a SourceFileMap representation. */
export const sourceFileMapNodeKinds = allNodeKinds.without(
    'Definition',
    'Module',
    'Reference',
);
