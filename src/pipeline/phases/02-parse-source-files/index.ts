import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import * as Prev from '../../representations/01-source-file-graph';
import {Binding, Module, Program, SourceFile} from '../../representations/02-source-file-asts';


export function parseSourceFiles(program: Prev.Program): Program {
    let files = program.files.map((sourceFile): SourceFile => {
        let sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        let module = parse(sourceText, {sourceFile});
        return {...sourceFile, module};
    });
    return {
        ...program,
        files,
        main: files[program.files.indexOf(program.main)],
    };
}


// TODO: doc parsing helpers
const grammar = fs.readFileSync(path.join(__dirname, 'pen-grammar.pegjs'), 'utf8');
let parse: (moduleSource: string, options: {sourceFile: Prev.SourceFile}) => Module<{Binding: Binding}>;
parse = pegjs.generate(grammar).parse;
