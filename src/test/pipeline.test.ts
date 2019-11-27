import {expect} from 'chai';
import * as path from 'path';
import {Options, pipeline} from '..';


describe('pipeline', () => {
    it('passes', () => {
        let filename = path.join(__dirname, '../../test/fixtures/math.pen');
        let options: Options = {filename};
        let program = pipeline(options);
        expect(program.imports).to.deep.equal(['pen']);
    });
});
