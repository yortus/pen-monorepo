import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'pen';




let mathGrammar = fs.readFileSync(path.join(__dirname, '../fixtures/math-grammar.txt'), 'utf8');
let {parse} = pen.evaluate(mathGrammar);

// let ast = parse(`(baaa)`);
let ast = parse(`111+20+(3+4)*3-7/(99999999+8)`);
console.log(JSON.stringify(ast, null, 2));
