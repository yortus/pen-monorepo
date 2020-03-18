export interface CompilerOptions {

    /** Module specifier of the main entry point of the program. If relative, will be resolved against the CWD. */
    main: string;

    // TODO: temp testing...
    // -required-
    // where the output package will be generated. If already exists, new files will overwrite existing ones.
    outDir: string;
}
