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

        // TODO: KNOWN BUGS:
        // `{"": 1} ==> {'': 1}`, // fails but should pass. Parser is not producing empty string, but rather NO_NODE
        // `3.14 ==> 3.14`, // fails but should pass because f64 not implemented yet.

        // Primitive values:
        `"abc" ==> "abc"`,
        `'abc' ==> ERROR`,
        `" a  b    c        " ==> " a  b    c        "`,
        `000987 ==> 987`,
        `-300521 ==> -300521`,
        `2147483647 ==> 2147483647`,
        `2147483648 ==> ERROR`,
        `-2147483648 ==> -2147483648`,
        `-2147483649 ==> ERROR`,
        `9999999999 ==> ERROR`,
        `0 ==> 0`,
        `-0 ==> ERROR`,
        // TODO: floating point tests (include infinity, nan, etc, which are not valid in JSON)
        `true ==> true`,
        `false ==> false`,
        `null ==> null`,
        `nil ==> ERROR`,
        `undefined ==> ERROR`,
        `/a/ ==> ERROR`,
        `"true" ==> "true"`,
        `"null" ==> "null"`,
        `'null' ==> ERROR`,

        // Objects
        `{} ==> {}`,
        `{"a": 1} ==> {a: 1}`,
        `{"a": 1, "b": 2} ==> {a: 1, b: 2}`,
        `{"a": 1, "b": 2, "c": 3} ==> {a: 1, b: 2, c: 3}`,
        `{"a": 1, "b": 2, "c": 3, "d": 4} ==> {a: 1, b: 2, c: 3, d: 4}`,
        `{a: 1} ==> ERROR`,
        `{"a": 1, b: 2} ==> ERROR`,
        `{'a': 1} ==> ERROR`,
        `{1: "a"} ==> ERROR`,
        `{"1": "a"} ==> {"1":"a"}`,
        `{"a": {}, "b": {"c": 42}} ==> {"a": {}, "b": {"c": 42}}`,
        `   {  "a"   : 1   }    ==> {a: 1}`,
        `   {  "a  "   : 1   }    ==> {'a  ': 1}`,
        `{,} ==> ERROR`,
        `{"a": {, "b": {"c": 42}} ==> ERROR`,
        `{"a": }, "b": {"c": 42}} ==> ERROR`,

        // Arrays
        `[] ==> []`,
        `[1] ==> [1]`,
        `[1, 2] ==> [1, 2]`,
        `[1, 22, 333] ==> [1, 22, 333]`,
        `[[1, [2, 33, [], 4]]] ==> [[1, [2, 33, [], 4]]]`,
        `    [    1     ]     ==> [1]`,
        `[,] ==> ERROR`,
        `[[1, [2, 33, [, 4]] ==> ERROR`,
        `[[1, [2, 33, ], 4]] ==> ERROR`,

        // Mixed types
        `[{"a": 1, "b": [42, 24]}, 33, [], [[{"b": 2}]]] ==> [{a: 1, b: [42, 24]}, 33, [], [[{b: 2}]]]`,

        // Whitespace and escape handling
        `   123   ==> 123`,
        `\t\n\n   "abc"\n   ==> "abc"`,
        `123\q ==> ERROR`,
        `"  \t  " ==> ERROR`,
        `"  \\t  " ==> "  \t  "`,
        `"  \\n  " ==> \`  \n  \``,
        // TODO: add unicode escape tests
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
