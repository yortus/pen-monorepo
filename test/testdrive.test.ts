import * as path from 'path';


const fixtureName = 'math';
const outFilePath = path.join(__dirname, './results/out', fixtureName, 'out.js');


describe('testdrive', async () => {

    it('works', async () => {

        // Require the output file and try using it for parsing/unparsing
        try {
            let punp = require(outFilePath);

            let ast = punp.parse('1+1');
            [] = [ast];

        }
        catch (err) {
            console.log(err);
            [] = [err];
        }
    });
});
