import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {mapMap} from '../../../utils';
import * as Prev from '../../representations/01-source-file-graph';
import {Binding, Module, Program, SourceFile} from '../../representations/02-source-file-asts';


export function parseSourceFiles(program: Prev.Program): Program<{Module: Module<{Binding: Binding}>}> {
    let sourceFiles = mapMap(program.sourceFiles, (sourceFile): SourceFile<{Module: Module<{Binding: Binding}>}> => {
        let sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        let module = parse(sourceText, {sourceFile});
        return {...sourceFile, module};
    });
    return {
        ...program,
        sourceFiles,
    };
}


// TODO: doc parsing helpers
const grammar = fs.readFileSync(path.join(__dirname, 'pen-grammar.pegjs'), 'utf8');
let parse: (moduleSource: string, options: {sourceFile: Prev.SourceFile}) => Module<{Binding: Binding}>;
parse = pegjs.generate(grammar).parse;
