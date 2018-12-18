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
        // Simple objects
        `{} ==> {}`,
        `{a: 1} ==> {a:1}`,
        `{a: 1, b: 2} ==> {a:1,b:2}`,
        `{a: 1, b: 2, c: 3} ==> {a:1,b:2,c:3}`,
        `{a: 1, b: 2, c: 3, d: 4} ==> {a:1,b:2,c:3,d:4}`,
        `{a: {}, b: {c: 42}} ==> {a:{},b:{c:42}}`,

        // true/false/null
        `{a: true, b: false, c: null} ==> {a:true,b:false,c:null}`,
        `{a: null} ==> {a:null}`,
        `{a: /a/} ==> ERROR`,
        `{a: "null"} ==> ERROR`,
        `{a: 'null'} ==> ERROR`,

        // Simple arrays
        `[] ==> []`,
        `[1] ==> [1]`,
        `[1, 2] ==> [1,2]`,
        `[1, 22, 333] ==> [1,22,333]`,
        `[[1, [2, 33, [], 4]]] ==> [[1,[2,33,[],4]]]`,

        // Mixed types
        `[{a: 1, b: [42, 24]}, 33, [], [[{b: 2}]]] ==> [{a:1,b:[42,24]},33,[],[[{b:2}]]]`,
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
