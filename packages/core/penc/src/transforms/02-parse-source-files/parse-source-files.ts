import * as fs from 'fs';
import {Module, Program} from '../../ast-nodes';
import {isExtension, mapMap} from '../../utils';
import {SourceFileGraph, SourceNodeKind} from '../asts';
import {parse as parseExtension} from './extension-grammar';
import {parse as parsePenSource} from './pen-grammar';


export function parseSourceFiles(sourceFileGraph: SourceFileGraph): Program<SourceNodeKind> {
    let sourceFiles = mapMap(sourceFileGraph.sourceFiles, (sourceFile): Module<SourceNodeKind> => {
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
        sourceFiles,
        mainPath: sourceFileGraph.mainPath,
    };
}
