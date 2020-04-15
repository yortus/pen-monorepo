import {expect} from 'chai';
import * as path from 'path';
import {compile} from '../src';


const fixtureName = 'math';
const inputPath = path.join(__dirname, './fixture-inputs', fixtureName);
const outputPath = path.join(__dirname, './fixture-outputs', fixtureName + '.js');


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
            expect(textᐟ).to.equal(test.text);
        });
    }
});
