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

        // TODO: KNOWN BUGS:
        // `3.14 ==> 3.14`, // fails but should pass because f64 not implemented yet.

        // Primitive values:
        `"abc" ==> "abc"`,
        `'abc' ==> "abc"`,
        `" a  b    c        " ==> " a  b    c        "`,
        `987 ==> 987`,
        `-300521 ==> -300521`,
        `2147483647 ==> 2147483647`,
        `2147483648 ==> ERROR`,
        `-2147483648 ==> -2147483648`,
        `-2147483649 ==> ERROR`,
        `9999999999 ==> ERROR`,
        `0 ==> 0`,
        `-0 ==> 0`,
        // TODO: floating point tests (include infinity, nan, etc, which are not valid in JSON)
        `true ==> true`,
        `false ==> false`,
        `null ==> null`,
        `undefined ==> ERROR`,
        `/a/ ==> ERROR`,
        `"true" ==> "true"`,
        `"null" ==> "null"`,
        `'null' ==> "null"`,

        // Objects
        `{} ==> {}`,
        `{a: 1} ==> {"a":1}`,
        `{a: 1, b: 2} ==> {"a":1,"b":2}`,
        `{a: 1, b: 2, c: 3} ==> {"a":1,"b":2,"c":3}`,
        `{a: 1, b: 2, c: 3, d: 4} ==> {"a":1,"b":2,"c":3,"d":4}`,
        `{a: {}, b: {c: 42}} ==> {"a":{},"b":{"c":42}}`,
        `{'': 1} ==> {"":1}`,
        `{1: 1} ==> {"1":1}`,
        `{a: 'aaa'} ==> {"a":"aaa"}`,
        `{1: 'a'} ==> {"1":"a"}`,

        // Arrays
        `[] ==> []`,
        `[1] ==> [1]`,
        `[1, 2] ==> [1,2]`,
        `[1, 22, 333] ==> [1,22,333]`,
        `[[1, [2, 33, [], 4]]] ==> [[1,[2,33,[],4]]]`,

        // Mixed types
        `[{"a": 1, "b": [42, 24]}, 33, [], [[{"b": 2}]]] ==> [{"a":1,"b":[42,24]},33,[],[[{"b":2}]]]`,
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
