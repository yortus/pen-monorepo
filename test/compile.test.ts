import * as fs from 'fs-extra';
import * as path from 'path';
import {compile} from '../src';


const fixtureName = 'math';
const fixturePath = path.join(__dirname, './fixtures', fixtureName);
const resultsPath = path.join(__dirname, './results');


describe('compile', async () => {

    it('works', async () => {

        // Delete results dir
        await fs.remove(resultsPath);

        // Copy fixture source to results dir
        await fs.copy(fixturePath, path.join(resultsPath, 'in', fixtureName));

        // Compile to output in results dir
        try {
            let str = compile({
                main: path.join(resultsPath, 'in', fixtureName),
                outDir: path.join(resultsPath, 'out', fixtureName),
            });
            [] = [str];
        }
        catch (err) {
            console.log(err);
            [] = [err];
        }
    });
});
