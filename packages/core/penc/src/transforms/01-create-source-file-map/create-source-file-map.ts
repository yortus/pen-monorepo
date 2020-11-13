import * as fs from 'fs';
import {SourceFile, traverseNode} from '../../abstract-syntax-trees';
import {SourceFileMap} from '../../representations';
import {AbsPath, isExtension, resolveModuleSpecifier} from '../../utils';
import {parse as parseExtFile} from './ext-file-grammar';
import {parse as parsePenFile} from './pen-file-grammar';


// TODO: jsdoc...
// TODO: doc/spec Options type properly
// TODO: assert sourceFileMapKinds before returning
export function createSourceFileMap(options: {main: string}): SourceFileMap {
    const sourceFilesByPath: Record<string, SourceFile> = {};
    const startPath = resolveModuleSpecifier(options.main);
    const unprocessedPaths = [startPath];
    const processedPaths = new Set<AbsPath>();
    while (unprocessedPaths.length > 0) {
        const sourceFilePath = unprocessedPaths.shift()!;
        if (processedPaths.has(sourceFilePath)) continue;
        processedPaths.add(sourceFilePath);

        // Parse this source file.
        const sourceText = fs.readFileSync(sourceFilePath, 'utf8');
        const parse = isExtension(sourceFilePath) ? parseExtFile : parsePenFile;
        const file = parse(sourceText, {path: sourceFilePath});
        sourceFilesByPath[sourceFilePath] = file;

        // Visit every ImportExpression, adding the imported path to `unprocessedPaths`.
        traverseNode(file, n => {
            if (n.kind !== 'ImportExpression') return;
            let importPath = resolveModuleSpecifier(n.moduleSpecifier, sourceFilePath);
            unprocessedPaths.push(importPath);
        });
    }
    return {sourceFilesByPath, startPath};
}
