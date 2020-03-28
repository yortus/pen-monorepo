import * as path from 'path';


const fixtureName = 'math';
const outFilePath = path.join(__dirname, './results/out', fixtureName, 'out.js');


describe('testdrive', async () => {

    it('works', async () => {

        // Require the output file and try using it for parsing/unparsing
        try {
            let punp = require(outFilePath);

            let text = '1+(-1-22)*333';
            let ast = punp.parse(text);
            let textᐟ = punp.unparse(ast);
            [] = [textᐟ];

        }
        catch (err) {
            console.log(err);
            [] = [err];
        }
    });
});
