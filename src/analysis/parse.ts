import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {Node} from '../ast2';




type Parser = (test: string) => Node<100, 'ModuleDefinition'>;




export const parse = pegjs.generate(getGrammar()).parse as Parser;




function getGrammar() {
    return fs.readFileSync(path.join(__dirname, 'pen-grammar.pegjs'), {encoding: 'utf8'});
}
