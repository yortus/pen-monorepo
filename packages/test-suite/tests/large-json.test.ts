import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
// @ts-expect-error Could not find a declaration file for module (7016)
import {parse, print} from '../baselines/pen-dist/json.js';


const jsonDocPath = path.join(__dirname, '../fixtures/documents/1mb.json');


describe(`Procesing a large JSON document`, () => {

    it('parses', () => {
        const buf = fs.readFileSync(jsonDocPath);
        const v8Json = JSON.parse(buf.toString('utf8'));
        const penJson = parse(buf);
        expect(penJson).to.deep.equal(v8Json);
    });

    it('prints', () => {
        const json = require(jsonDocPath);
        const v8Text = JSON.stringify(json);
        const buf = Buffer.alloc(2_000_000);
        const len = print(json, buf);
        const penText = buf.toString('utf8', 0, len);
        expect(penText).to.equal(v8Text);
    });
});
