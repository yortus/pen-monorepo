/** Indicates whether the file at the given path is an extension file (rather than a pen source file). */
export function isExtension(path: string) {
    return path.toLowerCase().endsWith('.pen.js');
}
