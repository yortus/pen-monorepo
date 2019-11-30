import {CompilerOptions} from './00-validated-compiler-options';


export type Node =
    | Program
    | SourceFile;


export interface Program {
    readonly kind: 'Program';
    readonly compilerOptions: CompilerOptions;
    readonly files: readonly SourceFile[];
    readonly main: SourceFile;
}


export interface SourceFile {
    readonly kind: 'SourceFile';

    /** The source file's absolute normalised path. */
    readonly path: string;

    // TODO: the modspec keys are verbatim from the source text
    /** Every module specifier imported by this source file, mapped to its own SourceFile object. */
    readonly imports: {[moduleSpecifier: string]: SourceFile};
}
