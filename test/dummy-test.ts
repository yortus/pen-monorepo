import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import {compileToJs} from 'penc';




describe('Dummy test', () => {
    it('passes', () => {
        expect(true).to.equal(true);


        let pen = fs.readFileSync(path.join(__dirname, './fixtures/math.pen'), {encoding: 'utf8'});
        let js = compileToJs({code: pen});

        console.log('\n\n\n\n');
        js.code.split('\n').forEach(line => console.log(line));

    });
});
