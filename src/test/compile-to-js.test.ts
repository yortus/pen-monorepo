// import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import {compileToJs} from '../compile-to-js';




const pen = `
/*
* egs:
*      2+3*5
*      42*(333-2)
*/

import {Memoize, i32} from 'pen'
import into pen from 'pen'

start = expr

expr = Memoize(add | sub | term)                        // Application, Selection
export add = {type: 'add', lhs: expr, rhs: "+" term}    // Record, ASL, CSL
export sub = {type: 'sub', lhs: expr, rhs: "\\-" term}

term = {                                                // Block
    start = Memoize(mul | div | factor)
    export mul = {type: 'mul', lhs: term, rhs: "*" factor}
    export div = {type: 'div', lhs: term, rhs: "/" factor}
}

factor = i32 | "(" expr ")"                             // Sequence


blahTest = term.mul | term.div |  pen.i32
`;




describe('compileToJs', () => {
    it('passes', () => {
        let js = compileToJs({code: pen});
        try { fs.mkdirSync(path.join(__dirname, '../../dist/out')); } catch {/***/}
        fs.writeFileSync(path.join(__dirname, '../../dist/out/dummy.js'), js.code, {encoding: 'utf8'});
    });
});
