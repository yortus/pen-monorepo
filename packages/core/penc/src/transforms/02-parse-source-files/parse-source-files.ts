import * as fs from 'fs';
import type {Module} from '../../abstract-syntax-trees';
import type {SourceFileGraph, SourceProgram} from '../../representations';
import {isExtension, mapMap} from '../../utils';
import {parse as parseExtension} from './extension-grammar';
import {parse as parsePenSource} from './pen-grammar';


export function parseSourceFiles(sourceFileGraph: SourceFileGraph): SourceProgram {
    let sourceFiles = mapMap(sourceFileGraph.sourceFiles, (sourceFile): Module => {
        let sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        if (!isExtension(sourceFile.path)) {
            return {...parsePenSource(sourceText, {sourceFile}), path: sourceFile.path};
        }
        else {
            let {exportedNames} = parseExtension(sourceText);
            return {
                kind: 'Module',
                bindings: exportedNames.map(name => ({
                    kind: 'LocalBinding',
                    localName: name,
                    value: {
                        kind: 'ExtensionExpression',
                        extensionPath: sourceFile.path,
                        bindingName: name,
                    },
                    exported: true,
                })),
            };
        }
    });
    return {
        kind: 'SourceProgram',
        sourceFiles: {
            kind: 'AbstractSyntaxTree',
            modulesByAbsPath: sourceFiles
        },
        mainPath: sourceFileGraph.mainPath,
    };
}
