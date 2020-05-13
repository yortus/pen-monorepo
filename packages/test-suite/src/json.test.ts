import {expect} from 'chai';
import * as path from 'path';
import {compile} from 'penc';


const fixtureName = 'json';
const inputPath = path.join(__dirname, '../fixtures/penc-input', fixtureName);
const outputPath = path.join(__dirname, '../baselines/penc-output', fixtureName + '.js');


describe(`Compiling and executing the 'json.pen' program`, async () => {

    const tests = [
        {text: '{}', ast: {}},
        {text: '[]', ast: []},
        {text: '123', ast: 123},
        {text: '"abc"', ast: 'abc'},
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
        {
            text: '"\\u0041+\s\\u2368"',
            ast: 'A+ ⍨',
        },

    ];

    it('compiles', async () => {
        compile({
            main: inputPath,
            outFile: outputPath,
        });
    });

    for (let test of tests) {
        it(test.text, () => {
            let {parse, print} = require(outputPath);

            let ast = parse(test.text);
            expect(ast).to.deep.equal(JSON.parse(test.text));

            let textᐟ = print(test.ast);
            expect(JSON.parse(textᐟ)).to.deep.equal(test.ast);
        });
    }
});
