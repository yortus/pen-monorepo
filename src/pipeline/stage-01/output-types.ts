export interface FileList {
    files: File[];
    main: File;
}


export interface File {

    /** The file's absolute normalised path. */
    path: string;

    // TODO: are the modspec keys verbatim from the source text, or abs normalised file paths?
    /** The files imported by this file. */
    imports: {[moduleSpecifier: string]: File};
}
