import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'penc';




describe('Unparsing math expressions', () => {

    // Compile the math grammar, and declare some helpers to express asts in the test cases.
    let mathGrammar = fs.readFileSync(path.join(__dirname, './fixtures/math.pen'), 'utf8');
    let {unparse} = pen.evaluate(mathGrammar);
    const add = (lhs: any, rhs: any) => `{type: 'add', lhs: ${lhs}, rhs: ${rhs}}`;
    const sub = (lhs: any, rhs: any) => `{type: 'sub', lhs: ${lhs}, rhs: ${rhs}}`;
    const mul = (lhs: any, rhs: any) => `{type: 'mul', lhs: ${lhs}, rhs: ${rhs}}`;
    const div = (lhs: any, rhs: any) => `{type: 'div', lhs: ${lhs}, rhs: ${rhs}}`;

    // List the test cases with their expected results.
    let tests = [
        `${add(1, 1)} ==> 1+1`,
        `987 ==> 987`,
        `3.14 ==> ERROR`,
        `-300521 ==> -300521`,
        `2147483647 ==> 2147483647`,
        `2147483648 ==> ERROR`,
        `-2147483648 ==> -2147483648`,
        `-2147483649 ==> ERROR`,
        `9999999999 ==> ERROR`,
        `0 ==> 0`,
        `-0 ==> 0`,
        `${add(add(1, 2), 3)} ==> 1+2+3`,
        `${add(1, add(2, 3))} ==> 1+(2+3)`,
        `${sub(30, mul(20, 10))} ==> 30-20*10`,
        `${mul(sub(30, 20), 10)} ==> (30-20)*10`,
        `${sub(add(add(111, 20), mul(add(3, 4), 3)), div(7, add(999, 8)))} ==> 111+20+(3+4)*3-7/(999+8)`,
    ];

    // Execute each test case.
    tests.forEach(test => {
        it(test, () => {
            let [astStr, expectedText] = test.split(' ==> ');
            // tslint:disable-next-line:no-eval
            let ast = eval(`(${astStr})`);
            let actualText = 'ERROR';
            try { actualText = unparse(ast); } catch {/**/}
            expect(actualText).to.equal(expectedText);
        });
    });
});
