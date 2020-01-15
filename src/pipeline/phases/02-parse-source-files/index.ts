import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {Module, Program, SourceFile} from '../../../node-types';
import {mapMap} from '../../../utils';
import {SourceFileGraph, SourceFileInfo} from '../01-gather-source-files';


export function parseSourceFiles(sourceFileGraph: SourceFileGraph): Program {
    let sourceFiles = mapMap(sourceFileGraph.sourceFiles, (sourceFile): SourceFile => {
        let sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        let module = parse(sourceText, {sourceFile});
        return {
            kind: 'SourceFile',
            path: sourceFile.path,
            imports: sourceFile.imports,
            module,
            meta: {},
        };
    });
    return {
        kind: 'Program',
        sourceFiles,
        mainPath: sourceFileGraph.mainPath,
        meta: {},
    };
}


// TODO: doc parsing helpers
const grammar = fs.readFileSync(path.join(__dirname, 'pen-grammar.pegjs'), 'utf8');
let parse: (moduleSource: string, options: {sourceFile: SourceFileInfo}) => Module;
parse = pegjs.generate(grammar).parse;
