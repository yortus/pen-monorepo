import {AbsPath} from '../utils';


/**
 * Data structure holding the absolute paths to all source files that make up a PEN program, as well as the
 * direct importing relationships between source files.
 */
export interface SourceFileGraph {

    /** List of all source files comprising a PEN program, as determined by transitive imports from the main file. */
    readonly sourceFiles: Map<AbsPath, SourceFileInfo>;

    /** Absolute path to the PEN program's main entry point file. */
    readonly mainPath: AbsPath;
}


/**
 * Descriptor for a single source file withing a PEN program.
 */
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
