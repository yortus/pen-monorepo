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
        // Simple objects
        `{} ==> {}`,
        `{a: 1} ==> {a: 1}`,
        `{a: 1, b: 2} ==> {a: 1, b: 2}`,
        `{a: 1, b: 2, c: 3} ==> {a: 1, b: 2, c: 3}`,
        `{a: 1, b: 2, c: 3, d: 4} ==> {a: 1, b: 2, c: 3, d: 4}`,
        `{a: {}, b: {c: 42}} ==> {a: {}, b: {c: 42}}`,
        `   {  a   : 1   }    ==> {a: 1}`,
        `{a: {, b: {c: 42}} ==> ERROR`,
        `{a: }, b: {c: 42}} ==> ERROR`,

        // true/false/null
        `{a: true, b: false, c: null} ==> {a: true, b: false, c: null}`,
        `{a: null} ==> {a: null}`,
        `{a: nil} ==> ERROR`,
        `{a: "null"} ==> ERROR`,
        `{a: 'null'} ==> ERROR`,

        // Simple arrays
        `[] ==> []`,
        `[1] ==> [1]`,
        `[1, 2] ==> [1, 2]`,
        `[1, 22, 333] ==> [1, 22, 333]`,
        `[[1, [2, 33, [], 4]]] ==> [[1, [2, 33, [], 4]]]`,
        `    [    1     ]     ==> [1]`,
        `[[1, [2, 33, [, 4]] ==> ERROR`,
        `[[1, [2, 33, ], 4]] ==> ERROR`,

        // Mixed types
        `[{a: 1, b: [42, 24]}, 33, [], [[{b: 2}]]] ==> [{a: 1, b: [42, 24]}, 33, [], [[{b: 2}]]]`,
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
