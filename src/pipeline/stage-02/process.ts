import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {Ast} from './output-types';


// TODO: doc...
export const process = pegjs.generate(getGrammar()).parse as (text: string) => Ast;


function getGrammar() {
    return fs.readFileSync(path.join(__dirname, 'pen-grammar.pegjs'), {encoding: 'utf8'});
}
