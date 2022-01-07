import {expect} from 'chai';
// @ts-expect-error Could not find a declaration file for module (7016)
import {parse, print} from '../baselines/pen-dist/json.js';


describe(`Compiling and executing the 'json.pen' program`, () => {

    const tests = [
        {text: 'null', ast: null},
        {text: 'true', ast: true},
        {text: 'false', ast: false},
        {text: '{}', ast: {}},
        {text: '[]', ast: []},
        {text: '123', ast: 123},
        {text: '"abc"', ast: 'abc'},
        {text: '"\\\\"', ast: '\\'},
        {text: '"\\t"', ast: '\t'},
        {text: '"\\u0041"', ast: 'A'},
        {text: '"\\u2368"', ast: '⍨'},
        {text: '"😄"', ast: '😄'},
        {text: '"\uD83D\uDE04"', ast: '😄'},
        {text: '"\\u0041+\\t\\u2368"', ast: 'A+\t⍨'},
        {text: '[5]', ast: [5]},
        {
            // NB: JSON doesn't accept some number formats that JS does - eg +3, 1., .1
            text: '[3.14, 5e-50, 200e3, -1.004]', // TODO: add more corner cases...
            ast: [3.14, 5e-50, 200e3, -1.004],
        },
        {text: '"\\t\\tabc\\r\\ndef"', ast: '\t\tabc\r\ndef'},
        {
            text: '[null, true, false]',
            ast: [null, true, false],
        },
        {
            text: '{"foo": "bar", "baz": 42}',
            ast: {foo: 'bar', baz: 42},
        },
        {
            text: `{
                "foo": "bar",
                "baz": [
                    1,
                    null,
                    57,
                    "abc.def",
                    {
                        "x": {
                            "x1": 0,
                            "x2": {
                                "eee": []
                            }
                        }
                    }
                ]
            }`,
            ast: {foo: 'bar', baz: [1, null, 57, 'abc.def', {x: {x1: 0, x2: {eee: []}}}]},
        },

        // TODO: add more unicode escapes in strings, corner cases (eg surrogate pairs - do they work in JSON?)
    ];

    for (const test of tests) {
        it(test.text, () => {
            const ast = parse(test.text);
            expect(ast).to.deep.equal(JSON.parse(test.text));

            const textᐟ = print(test.ast);
            expect(JSON.parse(textᐟ)).to.deep.equal(test.ast);
        });
    }
});
