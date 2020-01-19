import {expect} from 'chai';
import * as path from 'path';
import {compile, CompilerOptions} from '..';


describe('compile', () => {
    it('passes', () => {
        let main = path.join(__dirname, '../../test/fixtures/import-graph');
        let options: CompilerOptions = {main};
        let result = compile(options);
        expect(result).to.be.a('string');
        // TODO: was... expect(result).to.include({kind: 'Program'});
    });
});
