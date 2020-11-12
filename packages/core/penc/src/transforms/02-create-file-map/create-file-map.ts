import * as fs from 'fs';
import {File} from '../../abstract-syntax-trees';
import type {FileMap, SourceFileGraph} from '../../representations';
import {isExtension} from '../../utils';
import {parse as parseExtFile} from './ext-file-grammar';
import {parse as parsePenFile} from './pen-file-grammar';


// TODO: jsdoc...
export function createFileMap(sourceFileGraph: SourceFileGraph): FileMap {
    const filesByPath: Record<string, File> = {};
    for (const sourceFile of sourceFileGraph.sourceFiles.values()) {
        const sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        const parse = isExtension(sourceFile.path) ? parseExtFile : parsePenFile;
        const file = parse(sourceText, {sourceFile});
        filesByPath[file.path] = file;
    }
    return {
        filesByPath,
        startPath: sourceFileGraph.mainPath,
    };
}
