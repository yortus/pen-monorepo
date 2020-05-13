// tslint:disable: no-console
import {expect} from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';
import {compile} from 'penc';


const fixtureName = 'json';
const inputPath = path.join(__dirname, '../fixtures/penc-input', fixtureName);
const outputPath = path.join(__dirname, '../baselines/penc-output', fixtureName + '.js');
const jsonDocPath = path.join(__dirname, '../fixtures/documents/1mb.json');


describe(`Procesing a large JSON document`, async () => {
    before(() => {
        compile({
            main: inputPath,
            outFile: outputPath,
        });
    });

    it('parses', async () => {
        let {parse} = require(outputPath);

        let text = await fs.readFile(jsonDocPath, 'utf8');
        let t0 = new Date().getTime();
        let json1 = JSON.parse(text);
        let t1 = new Date().getTime();
        let json2 = parse(text);
        let t2 = new Date().getTime();
        expect(json2).to.deep.equal(json1);
        console.log(`JSON.parse took ${t1 - t0}ms`);
        console.log(`penc parse took ${t2 - t1}ms`);
    });

    it('prints', () => {
        let {print} = require(outputPath);

        let json = require(jsonDocPath);
        let t0 = new Date().getTime();
        let text1 = JSON.stringify(json);
        let t1 = new Date().getTime();
        let text2 = print(json);
        let t2 = new Date().getTime();
        expect(text2).to.equal(text1);
        console.log(`JSON.stringify took ${t1 - t0}ms`);
        console.log(`penc print took ${t2 - t1}ms`);
    });
});
