import * as fs from 'fs';
import {ExtensionFile, PenSourceFile, Program} from '../../ast-nodes';
import {mapMap} from '../../utils';
import {SourceFileGraph} from '../01-create-source-file-graph';
import {parse as parseExtension} from './extension-grammar';
import {parse as parsePenSource} from './pen-grammar';


export function parseSourceFiles(sourceFileGraph: SourceFileGraph): Program {
    let sourceFiles = mapMap(sourceFileGraph.sourceFiles, (sourceFile): PenSourceFile | ExtensionFile => {
        let isExtension = sourceFile.path.toLowerCase().endsWith('.pen.js');
        let sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        if (!isExtension) {
            let module = parsePenSource(sourceText, {sourceFile});
            return {
                kind: 'PenSourceFile',
                path: sourceFile.path,
                module,
                meta: {},
            };
        }
        else {
            let {exportedNames} = parseExtension(sourceText);
            return {
                kind: 'ExtensionFile',
                path: sourceFile.path,
                exportedNames,
                meta: {},
            };
        }
    });
    return {
        kind: 'Program',
        sourceFiles,
        mainPath: sourceFileGraph.mainPath,
        meta: {},
    };
}
