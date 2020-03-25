import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {CompilerOptions} from '../../compiler-options';
import {AbsPath} from '../../utils';
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
            sourceFile.imports[importModSpec] = getSourceFile(importPath).path;
            unprocessedPaths.push(importPath);
        }
    }

    return {sourceFiles, mainPath};
}


// TODO: doc parsing helpers
const grammar = fs.readFileSync(path.join(__dirname, 'pen-import-detection-grammar.pegjs'), 'utf8');
const detectImports = pegjs.generate(grammar).parse as (moduleSource: string) => string[];
