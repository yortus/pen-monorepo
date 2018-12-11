import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'pen';




let mathGrammar = fs.readFileSync(path.join(__dirname, './fixtures/math-grammar.txt'), 'utf8');
let {parse, unparse} = pen.evaluate(mathGrammar);




let text = `00111+20+(3+4)*3-7/(99999999+8)`;
// let text = `(1+2)+3`;
// let text = `(baaa)`;
console.log(`\n\n==================== PARSE(${JSON.stringify(text)})`);
let ast = parse(text);
console.log(JSON.stringify(ast, null, 2));




console.log(`\n\n==================== UNPARSE(<above ast>)`);
text = unparse(ast);
console.log(text);
