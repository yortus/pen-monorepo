import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
// @ts-expect-error Could not find a declaration file for module (7016)
import {parse, print} from '../baselines/pen-dist/json.js';


const jsonDocPath = path.join(__dirname, '../fixtures/documents/1mb.json');


describe(`Procesing a large JSON document`, async () => {

    it('parses', () => {
        const text = fs.readFileSync(jsonDocPath, 'utf8');
        const v8Json = JSON.parse(text);
        const penJson = parse(text);
        expect(penJson).to.deep.equal(v8Json);
    });

    it('prints', () => {
        const json = require(jsonDocPath);
        const v8Text = JSON.stringify(json);
        const penText = print(json);
        expect(penText).to.equal(v8Text);
    });
});
