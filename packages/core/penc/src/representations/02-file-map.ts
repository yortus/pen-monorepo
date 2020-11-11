import {allNodeKinds, File} from '../abstract-syntax-trees';


/** A PEN program expressed as a map from absolute paths to `File` AST nodes. */
export interface FileMap {
    readonly filesByPath: Record<string, File>;
    readonly startPath: string;
}


/** List of node kinds that may be present in a ModuleMap AST. */
export const fileMapKinds = allNodeKinds.without(
    'Definition',
    'Module',
    'Reference',
);
