import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as pen from 'penc';




describe('Unparsing JSON', () => {

    // Compile the JSON grammar.
    let jsonGrammar = fs.readFileSync(path.join(__dirname, './fixtures/json.pen'), 'utf8');
    let {unparse} = pen.evaluate(jsonGrammar);

    // List the test cases with their expected results.
    let tests = [
        `{AAA: 'BBB'} ==> AAABBB`,
        `{A: 'BBB'} ==> ABBB`,
        `{A: 'BBC'} ==> ERROR`,
        `{A: 'BBB', B: 'BBB'} ==> ERROR`,
        `{} ==> ERROR`,
        // `1+1 ==> ERROR`,
        // `AAABBB ==> {AAA: 'BBB'}`,
        // `ABBB ==> {A: 'BBB'}`,
        // `BBBB ==> ERROR`,
        // `AAAA ==> ERROR`,
    ];

    // Execute each test case.
    tests.forEach(test => {
        it(test, () => {
            let [astStr, expectedText] = test.split(' ==> ');
            // tslint:disable-next-line:no-eval
            let ast = eval(`(${astStr})`);
            let actualText = 'ERROR';
            try { actualText = unparse(ast); } catch {/**/}
            expect(actualText).to.deep.equal(expectedText);
        });
    });
});
