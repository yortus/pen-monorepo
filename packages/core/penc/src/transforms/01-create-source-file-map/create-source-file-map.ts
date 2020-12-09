import * as fs from 'fs';
import {BindingList, traverseNode} from '../../abstract-syntax-trees';
import {SourceFileMap, sourceFileMapNodeKinds} from '../../representations';
import {AbsPath, assert, isDebugMode, isExtension, resolveModuleSpecifier} from '../../utils';
import {parseExtFile, parsePenFile} from './grammars';


/**
 * Creates the SourceFileMap representation for the PEN program specified by `options.main`. Finds the transitive
 * closure of all source files comprising the program by parsing each source file and analysing each encountered
 * `ImportExpression` to determine whether more source files need to be included in the SourceFileMap representation.
 * @param options.main absolute file path to the main source file for the PEN program.
 */
export function createSourceFileMap(options: {main: AbsPath}): SourceFileMap {
    const sourceFilesByPath: Record<string, BindingList> = {};
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
        const sourceFile = parse(sourceText, {path: sourceFilePath});
        sourceFilesByPath[sourceFilePath] = sourceFile;

        // Visit every ImportExpression, adding the imported path to `unprocessedPaths`.
        traverseNode(sourceFile, n => {
            if (n.kind !== 'ImportExpression') return;
            const importPath = resolveModuleSpecifier(n.moduleSpecifier, sourceFilePath);
            unprocessedPaths.push(importPath);
        });
    }

    // In debug mode, ensure only allowed node kinds are present in the representation.
    if (isDebugMode()) {
        for (let n of Object.values(sourceFilesByPath)) traverseNode(n, n => assert(sourceFileMapNodeKinds.matches(n)));
    }

    return {sourceFilesByPath, startPath};
}
