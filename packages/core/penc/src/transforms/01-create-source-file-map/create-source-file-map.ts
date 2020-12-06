import * as fs from 'fs';
import {Binding, traverseNode} from '../../abstract-syntax-trees';
import type {SourceFileMap} from '../../representations';
import {AbsPath, isExtension, resolveModuleSpecifier} from '../../utils';
import {parse as parseExtFile} from './ext-file-grammar';
import {parse as parsePenFile} from './pen-file-grammar';


// TODO: jsdoc...
// - follows ImportExpressions to find transitive closure of source files, and parses them all
// - parses both pen source (.pen files) and pen extensions (.pen.js files)
// TODO: doc/spec Options type properly
export function createSourceFileMap(options: {main: string}): SourceFileMap {
    const sourceFilesByPath: Record<string, {bindings: Binding[]}> = {};
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
        const bindings = parse(sourceText, {path: sourceFilePath});
        sourceFilesByPath[sourceFilePath] = {bindings};

        // Visit every ImportExpression, adding the imported path to `unprocessedPaths`.
        traverseNode({kind: 'Module', bindings}, n => {
            if (n.kind !== 'ImportExpression') return;
            const importPath = resolveModuleSpecifier(n.moduleSpecifier, sourceFilePath);
            unprocessedPaths.push(importPath);
        });
    }

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    // traverseNode(null!, n => assert(sourceFileMapKinds.matches(n)));

    return {
        sourceFilesByPath,
        startPath,
    };
}
