import {expect} from 'chai';
import * as path from 'path';
import {compile} from '../src';


const fixtureName = 'math';
const inputPath = path.join(__dirname, './fixtures/penc-input', fixtureName);
const outputPath = path.join(__dirname, './baselines/penc-output', fixtureName + '.js');


describe(`Compiling and executing the 'math.pen' program`, async () => {

    const tests = [
        {
            text: '1+2',
            ast: {
                type: 'add',
                lhs: 1,
                rhs: 2,
            },
        },
        {
            text: '1+(-1-22)*333',
            ast: {
                type: 'add',
                lhs: 1,
                rhs: {
                    type: 'mul',
                    lhs: {
                        type: 'sub',
                        lhs: -1,
                        rhs: 22,
                    },
                    rhs: 333,
                },
            },
        },
        {
            text: '.2*3.14159+4e20*4.e-17',
            ast: {
                type: 'add',
                lhs: {
                    type: 'mul',
                    lhs: 0.2,
                    rhs: 3.14159,
                },
                rhs: {
                    type: 'mul',
                    lhs: 400_000_000_000_000_000_000,
                    rhs: 4e-17,
                },
            },
            textᐟ: '0.2*3.14159+400000000000000000000*4e-17',
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
            let {parse, unparse} = require(outputPath);
            let ast = parse(test.text);
            expect(ast).to.deep.equal(test.ast);
            let textᐟ = unparse(ast);
            expect(textᐟ).to.equal(test.textᐟ || test.text);
        });
    }
});
