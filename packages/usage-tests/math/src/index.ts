import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'pen';




let mathGrammar = fs.readFileSync(path.join(__dirname, '../fixtures/math-grammar.txt'), 'utf8');
let ast = pen.test(mathGrammar);
console.log(JSON.stringify(ast, null, 2));
