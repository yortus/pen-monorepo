import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
import {Options} from '../../options';
import {Program} from './output-types';


// TODO: doc...
export function process(options: Options): Program {
    let text = fs.readFileSync(options.filename, 'utf8');
    let imports = detectImports(text);
    return {imports};
}


const grammar = fs.readFileSync(path.join(__dirname, 'pen-import-detection-grammar.pegjs'), 'utf8');
const detectImports = pegjs.generate(grammar).parse as (text: string) => string[];
