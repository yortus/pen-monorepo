// TODO: jsdoc... must specify either `main` or `source`
export interface CompilerOptions {

    /** Module specifier of the main entry point of the program. If relative, will be resolved against the CWD. */
    main?: string;

    // TODO: jsdoc... immediate mode
    source?: string;
}
