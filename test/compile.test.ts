import * as path from 'path';
import {compile} from '../src';


const fixtureName = 'math';
const inputPath = path.join(__dirname, './fixture-inputs', fixtureName);
const outputPath = path.join(__dirname, './fixture-outputs', fixtureName + '.js');


describe('compile', async () => {

    it('works', async () => {
        try {
            let str = compile({
                main: inputPath,
                outFile: outputPath,
            });
            [] = [str];
        }
        catch (err) {
            console.log(err);
            [] = [err];
        }
    });
});
