import {expect} from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';
// @ts-expect-error Could not find a declaration file for module (7016)
import {parse as parsePen, print as printPen} from '../baselines/pen-dist/json.js';
// @ts-expect-error Could not find a declaration file for module (7016)
import {parse as parsePeg} from '../fixtures/scripts/pegjs-json-parser';


const jsonDocPath = path.join(__dirname, '../fixtures/documents/1mb.json');


describe(`Procesing a large JSON document`, async () => {

    it('parses', async () => {
        let text = await fs.readFile(jsonDocPath, 'utf8');
        let t0 = new Date().getTime();
        let v8Json = JSON.parse(text);
        let t1 = new Date().getTime();
        let penJson = parsePen(text);
        let t2 = new Date().getTime();
        let pegJson = parsePeg(text);
        let t3 = new Date().getTime();
        expect(penJson).to.deep.equal(v8Json);
        expect(pegJson).to.deep.equal(v8Json);
        console.log(`JSON.parse took ${t1 - t0}ms`);
        console.log(`penc parse took ${t2 - t1}ms`);
        console.log(`pegjs parse took ${t3 - t2}ms`);
    });

    it('prints', () => {
        let json = require(jsonDocPath);
        let t0 = new Date().getTime();
        let text1 = JSON.stringify(json);
        let t1 = new Date().getTime();
        let text2 = printPen(json);
        let t2 = new Date().getTime();
        expect(text2).to.equal(text1);
        console.log(`JSON.stringify took ${t1 - t0}ms`);
        console.log(`penc print took ${t2 - t1}ms`);
    });
});
