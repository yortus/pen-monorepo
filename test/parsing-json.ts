import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'penc';




describe('Parsing JSON', () => {

    // Compile the JSON grammar.
    let jsonGrammar = fs.readFileSync(path.join(__dirname, './fixtures/json.pen'), 'utf8');
    let {parse} = pen.evaluate(jsonGrammar);

    // List the test cases with their expected results.
    let tests = [
        `1+1 ==> ERROR`,
        `AAABBB ==> {AAA: 'BBB'}`,
        `ABBB ==> {A: 'BBB'}`,
        `BBBB ==> ERROR`,
        `AAAA ==> ERROR`,
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
