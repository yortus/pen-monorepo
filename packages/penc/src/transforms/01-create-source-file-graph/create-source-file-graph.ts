import * as fs from 'fs';
import {CompilerOptions} from '../../compiler-options';
import {AbsPath} from '../../utils';
import {parse as detectImports} from './pen-import-detection-grammar';
import {resolveModuleSpecifier} from './resolve-module-specifier';
import {SourceFileGraph, SourceFileInfo} from './source-file-graph';


// TODO: doc...
export function createSourceFileGraph(compilerOptions: CompilerOptions): SourceFileGraph {
    let sourceFiles = new Map<AbsPath, SourceFileInfo>();

    function getSourceFile(absPath: AbsPath) {
        let sourceFile = sourceFiles.get(absPath);
        if (!sourceFile) {
            sourceFile = {path: absPath, imports: {}};
            sourceFiles.set(absPath, sourceFile);
        }
        return sourceFile;
    }

    let mainPath = resolveModuleSpecifier(compilerOptions.main);
    let unprocessedPaths = [mainPath];
    let processedPaths = new Set<AbsPath>();
    while (unprocessedPaths.length > 0) {
        let sourceFilePath = unprocessedPaths.shift()!;
        if (processedPaths.has(sourceFilePath)) continue;

        processedPaths.add(sourceFilePath);
        let sourceFile = getSourceFile(sourceFilePath);

        let sourceText = fs.readFileSync(sourceFilePath, 'utf8');
        let importModSpecs = detectImports(sourceText);
        for (let importModSpec of importModSpecs) {
            let importPath = resolveModuleSpecifier(importModSpec, sourceFilePath);
            if (importPath === 'std') continue;
            if (importPath === 'experiments') continue;
            sourceFile.imports[importModSpec] = getSourceFile(importPath).path;
            unprocessedPaths.push(importPath);
        }
    }

    return {sourceFiles, mainPath};
}