import {expect} from 'chai';
import * as path from 'path';
import {CompilerOptions, pipeline} from '..';


describe('pipeline', () => {
    it('passes', () => {
        let main = path.join(__dirname, '../../test/fixtures/import-graph');
        let options: CompilerOptions = {main};
        let result = pipeline(options);
        expect(result).to.include({kind: 'Program'});
    });
});
