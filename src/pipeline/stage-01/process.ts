import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {Options} from '../../options';
import {File, FileList} from './output-types';
import {resolveModuleSpecifier} from './resolve-module-specifier';


// TODO: doc...
export function process(options: Options): FileList {

    let fileMap = new Map<string, File>();

    function getFile(absPath: string) {
        let file = fileMap.get(absPath);
        if (!file) {
            file = {path: absPath, imports: {}};
            fileMap.set(absPath, file);
        }
        return file;
    }

    let mainPath = resolveModuleSpecifier(options.main);
    let unprocessedPaths = [mainPath];
    let processedPaths = new Set<string>();
    while (unprocessedPaths.length > 0) {
        let filePath = unprocessedPaths.shift()!;
        if (processedPaths.has(filePath)) continue;

        processedPaths.add(filePath);
        let file = getFile(filePath);

        let moduleSource = fs.readFileSync(filePath, 'utf8');
        let importModSpecs = detectImports(moduleSource);
        for (let importModSpec of importModSpecs) {
            let importPath = resolveModuleSpecifier(importModSpec, filePath);
            file.imports[importModSpec] = getFile(importPath);
            unprocessedPaths.push(importPath);
        }
    }

    return {
        files: [...fileMap.values()],
        main: getFile(mainPath),
    };
}


// TODO: doc parsing helpers
const grammar = fs.readFileSync(path.join(__dirname, 'pen-import-detection-grammar.pegjs'), 'utf8');
const detectImports = pegjs.generate(grammar).parse as (moduleSource: string) => string[];
