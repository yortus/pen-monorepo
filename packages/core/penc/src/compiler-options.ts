export interface CompilerOptions {

    /** Module specifier of the main entry point of the program. If relative, will be resolved against the CWD. */
    main: string;

    // TODO: temp testing...
    // -required-
    // Path where the output file will be generated. If the file already exists, it will be overwritten.
    // If relative, will be resolved against the CWD.
    // If omitted, will be same as main path but with extension changed to '.js'
    outFile?: string;
}
