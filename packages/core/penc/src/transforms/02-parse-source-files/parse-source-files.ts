import * as fs from 'fs';
import {SourceFileGraph, SourceModule, SourceProgram} from '../../representations';
import {isExtension, mapMap} from '../../utils';
import {parse as parseExtension} from './extension-grammar';
import {parse as parsePenSource} from './pen-grammar';


export function parseSourceFiles(sourceFileGraph: SourceFileGraph): SourceProgram {
    let sourceFiles = mapMap(sourceFileGraph.sourceFiles, (sourceFile): SourceModule => {
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
        kind: 'Program',
        sourceFiles: {kind: 'ModuleMap', byAbsPath: sourceFiles},
        mainPath: sourceFileGraph.mainPath,
    };
}
