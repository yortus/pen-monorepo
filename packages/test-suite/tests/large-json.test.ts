import {expect} from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';
// @ts-expect-error Could not find a declaration file for module (7016)
import {parse, print} from '../baselines/pen-dist/json.js';


const jsonDocPath = path.join(__dirname, '../fixtures/documents/1mb.json');


describe(`Procesing a large JSON document`, async () => {

    it('parses', async () => {
        let text = await fs.readFile(jsonDocPath, 'utf8');
        let v8Json = JSON.parse(text);
        let penJson = parse(text);
        expect(penJson).to.deep.equal(v8Json);
    });

    it('prints', () => {
        let json = require(jsonDocPath);
        let v8Text = JSON.stringify(json);
        let penText = print(json);
        expect(penText).to.equal(v8Text);
    });
});
