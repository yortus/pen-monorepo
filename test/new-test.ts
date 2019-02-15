// import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'penc';




// TODO: temp testing... remove...
describe('NEW TEST', () => {

    // Compile the math grammar, and declare some helpers to express asts in the test cases.
    let mathGrammar = fs.readFileSync(path.join(__dirname, './fixtures/math.pen'), 'utf8');
    let x = pen.NEWtranspileToJS(mathGrammar);
    x;
//    let {parse} = pen.evaluate(mathGrammar);

    // List the test cases with their expected results.
    let tests = [
        `000987 ==> 987`,
    ];

    // Execute each test case.
    tests.forEach(test => {
        it(test, () => {
            // let [text, astStr] = test.split(' ==> ');
            // // tslint:disable-next-line:no-eval
            // let expectedAst = astStr !== 'ERROR' ? eval(`(${astStr})`) : 'ERROR';
            // let actualAst: unknown = 'ERROR';
            // try { actualAst = parse(text); } catch {/**/}
            // expect(actualAst).to.deep.equal(expectedAst);
        });
    });
});
