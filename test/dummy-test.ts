//import {expect} from 'chai';
import {compileToJs} from 'penc';




const pen = `
/*
* egs:
*      2+3*5
*      42*(333-2)
*/

import Memoize, i32 from 'pen'

start = expr

expr = Memoize(add | sub | term)
add = {type: 'add', lhs: expr, rhs: "+" term}
sub = {type: 'sub', lhs: expr, rhs: "\\-" term}

term = {
    start = Memoize(mul | div | factor)
    mul = {type: 'mul', lhs: term, rhs: "*" factor}
    div = {type: 'div', lhs: term, rhs: "/" factor}
}

factor = i32 | "(" expr ")"
`;




describe('Dummy test', () => {
    it('passes', () => {

        let js = compileToJs({code: pen});

        console.log('\n\n\n\n');
        js.code.split('\n').forEach(line => console.log(line));

    });
});
