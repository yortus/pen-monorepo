import {expect} from 'chai';
import * as path from 'path';
import {compile} from '../src';


const fixtureName = 'math';
const inputPath = path.join(__dirname, './fixture-inputs', fixtureName);
const outputPath = path.join(__dirname, './fixture-outputs', fixtureName + '.js');


describe('Compiling and running PEN programs', async () => {

    it('compiles', async () => {
        compile({
            main: inputPath,
            outFile: outputPath,
        });
    });

    it('runs round-trip', async () => {
        let {parse, unparse} = require(outputPath);

        let text = '1+(-1-22)*333';
        let ast = parse(text);
        let textᐟ = unparse(ast);
        expect(textᐟ).equals(text);
    });
});
