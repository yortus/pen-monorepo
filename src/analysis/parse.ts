import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {ModuleDefinition} from '../ast';




export const parse = pegjs.generate(getGrammar()).parse as (text: string) => ModuleDefinition;




function getGrammar() {
    return fs.readFileSync(path.join(__dirname, 'pen-grammar.pegjs'), {encoding: 'utf8'});
}
