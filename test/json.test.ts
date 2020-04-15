import {expect} from 'chai';
import * as path from 'path';
import {compile} from '../src';


const fixtureName = 'json';
const inputPath = path.join(__dirname, './fixture-inputs', fixtureName);
const outputPath = path.join(__dirname, './fixture-outputs', fixtureName + '.js');


describe(`Compiling and executing the 'json.pen' program`, async () => {

    const tests = [
        {
            text: '{}',
            ast: '???',
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
