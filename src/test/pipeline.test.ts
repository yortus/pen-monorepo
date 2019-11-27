import {expect} from 'chai';
import * as path from 'path';
import {Options, pipeline} from '..';


describe('pipeline', () => {
    it('passes', () => {
        let main = path.join(__dirname, '../../test/fixtures/import-graph');
        let options: Options = {main};
        let fileList = pipeline(options);
        expect(fileList.main.imports).to.have.keys('pen');
    });
});
