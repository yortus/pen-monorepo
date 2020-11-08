import * as fs from 'fs';
import {SourceFileGraph, SourceFileInfo} from '../../representations';
import {AbsPath} from '../../utils';
import {parse as detectImports} from './pen-import-detection-grammar';
import {resolveModuleSpecifier} from './resolve-module-specifier';


// TODO: jsdoc...
export function createSourceFileGraph(options: {main: string}): SourceFileGraph {
    const sourceFiles = new Map<AbsPath, SourceFileInfo>();

    function getSourceFile(absPath: AbsPath) {
        let sourceFile = sourceFiles.get(absPath);
        if (!sourceFile) {
            sourceFile = {path: absPath, imports: {}};
            sourceFiles.set(absPath, sourceFile);
        }
        return sourceFile;
    }

    const mainPath = resolveModuleSpecifier(options.main);
    const unprocessedPaths = [mainPath];
    const processedPaths = new Set<AbsPath>();
    while (unprocessedPaths.length > 0) {
        const sourceFilePath = unprocessedPaths.shift()!;
        if (processedPaths.has(sourceFilePath)) continue;

        processedPaths.add(sourceFilePath);
        const sourceFile = getSourceFile(sourceFilePath);

        const sourceText = fs.readFileSync(sourceFilePath, 'utf8');
        const importModSpecs = detectImports(sourceText);
        for (const importModSpec of importModSpecs) {
            const importPath = resolveModuleSpecifier(importModSpec, sourceFilePath);
            sourceFile.imports[importModSpec] = getSourceFile(importPath).path;
            unprocessedPaths.push(importPath);
        }
    }

    return {sourceFiles, mainPath};
}
