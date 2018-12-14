import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'penc';




describe('Parsing math expressions', () => {

    // Compile the math grammar, and declare some helpers to express asts in the test cases.
    let mathGrammar = fs.readFileSync(path.join(__dirname, './fixtures/math.pen'), 'utf8');
    let {parse} = pen.evaluate(mathGrammar);
    const add = (lhs: any, rhs: any) => `{type: 'add', lhs: ${lhs}, rhs: ${rhs}}`;
    const sub = (lhs: any, rhs: any) => `{type: 'sub', lhs: ${lhs}, rhs: ${rhs}}`;
    const mul = (lhs: any, rhs: any) => `{type: 'mul', lhs: ${lhs}, rhs: ${rhs}}`;
    const div = (lhs: any, rhs: any) => `{type: 'div', lhs: ${lhs}, rhs: ${rhs}}`;

    // List the test cases with their expected results.
    let tests = [
        `1+1 ==> ${add(1, 1)}`,
        `000987 ==> 987`,
        `3.14 ==> ERROR`,
        `-300521 ==> -300521`,
        `2147483647 ==> 2147483647`,
        `2147483648 ==> ERROR`,
        `-2147483648 ==> -2147483648`,
        `-2147483649 ==> ERROR`,
        `9999999999 ==> ERROR`,
        `0 ==> 0`,
        `-0 ==> ERROR`,
        `1+2+3 ==> ${add(add(1, 2), 3)}`,
        `(1+2)+3 ==> ${add(add(1, 2), 3)}`,
        `1+(2+3) ==> ${add(1, add(2, 3))}`,
        `30-20*10 ==> ${sub(30, mul(20, 10))}`,
        `00111+20+(3+4)*3-7/(999+8) ==> ${sub(add(add(111, 20), mul(add(3, 4), 3)), div(7, add(999, 8)))}`,
    ];

    // Execute each test case.
    tests.forEach(test => {
        it(test, () => {
            let [text, astStr] = test.split(' ==> ');
            // tslint:disable-next-line:no-eval
            let expectedAst = astStr !== 'ERROR' ? eval(`(${astStr})`) : 'ERROR';
            let actualAst: unknown = 'ERROR';
            try { actualAst = parse(text); } catch {/**/}
            expect(actualAst).to.deep.equal(expectedAst);
        });
    });
});
