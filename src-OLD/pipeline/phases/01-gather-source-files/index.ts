import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {AbsPath} from '../../../utils';
import {CompilerOptions} from '../../representations/00-validated-compiler-options';
import {Program, SourceFile} from '../../representations/01-source-file-graph';
import {resolveModuleSpecifier} from './resolve-module-specifier';


// TODO: doc...
export function gatherSourceFiles(compilerOptions: CompilerOptions): Program {

    let sourceFiles = new Map<AbsPath, SourceFile>();

    function getSourceFile(absPath: AbsPath) {
        let sourceFile = sourceFiles.get(absPath);
        if (sourceFile) return sourceFile;

        sourceFile = {kind: 'SourceFile', path: absPath, imports: {}};
        sourceFiles.set(absPath, sourceFile);
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
            sourceFile.imports[importModSpec] = getSourceFile(importPath).path;
            unprocessedPaths.push(importPath);
        }
    }

    return {
        kind: 'Program',
        compilerOptions,
        sourceFiles,
        mainPath,
    };
}


// TODO: doc parsing helpers
const grammar = fs.readFileSync(path.join(__dirname, 'pen-import-detection-grammar.pegjs'), 'utf8');
const detectImports = pegjs.generate(grammar).parse as (moduleSource: string) => string[];
