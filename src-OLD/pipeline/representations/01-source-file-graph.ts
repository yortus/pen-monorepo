import {AbsPath} from '../../utils';
import {CompilerOptions} from './00-validated-compiler-options';


export type Node =
    | Program
    | SourceFile;


export interface Program {
    readonly kind: 'Program';
    readonly compilerOptions: CompilerOptions;
    readonly sourceFiles: ReadonlyMap<AbsPath, SourceFile>;
    readonly mainPath: AbsPath;
}


export interface SourceFile {
    readonly kind: 'SourceFile';

    /** The source file's normalised absolute path. */
    readonly path: AbsPath;

    /**
     * A map with one entry for each import expression in this source file. The keys are the imported module
     * specifiers, exactly as they appear in the source text. The values are the normalised absolute paths of
     * the corresponding imported SourceFiles.
     */
    readonly imports: {[moduleSpecifier: string]: AbsPath};
}
