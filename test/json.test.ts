import {expect} from 'chai';
import * as path from 'path';
import {compile} from '../src';


const fixtureName = 'json';
const inputPath = path.join(__dirname, './fixtures/penc-input', fixtureName);
const outputPath = path.join(__dirname, './baselines/penc-output', fixtureName + '.js');


describe(`Compiling and executing the 'json.pen' program`, async () => {

    const tests = [
        {text: '{}', ast: {}},
        {text: '[]', ast: []},
        {text: '123', ast: 123},
        {text: '"abc"', ast: 'abc'},
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
        // TODO: unicode escapes in strings
        // TODO: floating point numbers
    ];

    it('compiles', async () => {
        compile({
            main: inputPath,
            outFile: outputPath,
        });
    });

    for (let test of tests) {
        it(test.text, () => {
            let {parse, unparse} = require(outputPath);

            let ast = parse(test.text);
            expect(ast).to.deep.equal(JSON.parse(test.text));

            let textᐟ = unparse(test.ast);
            expect(JSON.parse(textᐟ)).to.deep.equal(test.ast);
        });
    }
});
